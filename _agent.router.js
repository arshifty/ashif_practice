const Supporter = require('../../../models/supporter.model');
const Balance = require('../../../models/balance.model');
const Transcation = require('../../../models/transaction.model');
const Sales = require('../../../models/sales.model');
const Club = require('../../../models/club.model');
const mongoose = require('mongoose');
const GlobalMethods = require('../api.service');
const SharedMethods = require('../shared');
module.exports = ((app, router, auth) => {
    router.route('/club/agents')
        .get(auth, (req, res) => {

            let page_no = req.query.page_no ? parseInt(req.query.page_no) : 1;
            let page_size = req.query.page_size ? parseInt(req.query.page_size) : 10;
            let cond = {};
            let result = new Object();
            cond['supporter_type'] = 'agent';
            cond['agent_type'] = 'club_reseller';
            cond['favourite_club'] = mongoose.Types.ObjectId(req.user.club_id);

            if (req.query.first_name) {
                let expression = '.*' + req.query.first_name + '.*';
                cond['first_name'] = { $regex: expression, $options: 'i' };
            }
            if (req.query.last_name) {
                let expression = '.*' + req.query.last_name + '.*';
                cond['last_name'] = { $regex: expression, $options: 'i' };
            }

            if (req.query.view_type == 'active') {
                cond['is_active'] = true;
            } else {

                cond['is_active'] = false;
            }

            Supporter.aggregate([
                {
                    $lookup:
                    {
                        from: 'balances',
                        localField: '_id',
                        foreignField: 'supporter_id',
                        as: 'amount'
                    }
                },
                {
                    $unwind: '$amount'
                },
                {
                    $match: cond
                },
                {
                    $project: {
                        first_name: "$first_name",
                        last_name: "$last_name",
                        balance: "$amount.balance",
                        purchase: "$amount.purchase",
                        reseller_reward: "$reseller_reward",
                        is_active: "$is_active"
                    }
                },
                {
                    $sort: { _id: -1 }
                }

            ]).
                exec()
                .then(counts => {
                    result.count = counts.length;
                    return Supporter.aggregate([
                        {
                            $lookup:
                            {
                                from: 'balances',
                                localField: '_id',
                                foreignField: 'supporter_id',
                                as: 'amount'
                            }
                        },
                        {
                            $unwind: '$amount'
                        },
                        {
                            $lookup:
                            {
                                from: 'clubs',
                                localField: 'favourite_club',
                                foreignField: '_id',
                                as: 'club'
                            }
                        },
                        {
                            $unwind: '$club'
                        },
                        {
                            $match: cond
                        },
                        {
                            $project: {
                                _id: "$_id",
                                first_name: "$first_name",
                                last_name: "$last_name",
                                business_name: "$business_name",
                                address1: "$address1",
                                address2: "$address2",
                                town: "$town",
                                country: "$country",
                                county: "$county",
                                phone: "$phone",
                                postcode: "$postcode",
                                email: "$email",
                                email: "$email",
                                date_of_birth: "$date_of_birth",
                                supporter_type: "$supporter_type",
                                balance: "$amount.balance",
                                purchase: "$amount.purchase",
                                reseller_reward: "$reseller_reward",
                                is_active: "$is_active",
                                supporting_teams: "$club.supporting_teams"
                            }
                        },
                        {
                            $sort: { _id: -1 }
                        }
                    ])
                        .skip(page_size * (page_no - 1))
                        .limit(page_size)
                })
                .then(supporters => {
                    result.supporters = supporters;
                    res.json({ success: true, result: result });
                })
                .catch(err => {
                    res.json({ success: false, result: err });
                })
        })

        .post(auth, (req, res) => {
            Supporter.findOne({ email: req.body.email.toLowerCase() })
                .exec()
                .then(supporter => {
                    if (supporter && supporter._id) {
                        res.json({ success: false, message: 'This email has already been taken.' })
                    } else {
                        let newReseller = new Supporter();
                        GlobalMethods.getNextSequence('support_token')
                            .then(seq => {
                                return Supporter.create({
                                    first_name: req.body.first_name,
                                    last_name: req.body.last_name,
                                    business_name: req.body.business_name,
                                    address1: req.body.address1,
                                    address2: req.body.address2,
                                    town: req.body.town,
                                    postcode: req.body.postcode,
                                    favourite_club: req.user.club_id,
                                    prefered_clubs: req.user.club_id,
                                    date_of_birth: req.body.date_of_birth,
                                    phone: req.body.phone,
                                    agent_type: 'club_reseller',
                                    reseller_reward: req.body.reseller_reward,
                                    country: req.body.country,
                                    county: req.body.county,
                                    supporter_number: seq,
                                    email: req.body.email.toLowerCase(),
                                    supporter_type: req.body.supporter_type,
                                    password: newReseller.generateHash(req.body.phone),
                                    invitation_status: "Accept",
                                    "password_info.is_created": true,
                                    "password_info.created_at": new Date(),
                                    has_registration_done: true,
                                    "varification.is_verified": true,
                                    is_active: true,
                                    created_at: new Date()
                                })
                            })
                            .then(agent => {
                                if (agent && agent._id) {
                                    let new_balance_data = {
                                        club_id: req.user.club_id,
                                        supporter_id: agent._id,
                                        supporter_type: 'agent',
                                        balance: 0,
                                        purchase: 0,
                                        is_transaction_in_process: false,
                                        created_at: new Date()
                                    }
                                    SharedMethods.supporterBalance(new_balance_data);
                                    GlobalMethods.actionLogger(req, 'ClubAdmin', 'Create success', 'Reseller created succesfully');
                                    GlobalMethods.mailToInviteLogin(agent, req.user, 'club_reseller');
                                    res.json({ success: true, message: "Reseller Created Succesfully." });
                                }
                                else {
                                    GlobalMethods.actionLogger(req, 'ClubAdmin', 'update failed', 'Reseller create failed');
                                    res.json({ success: false, message: 'Internal server error.' })
                                }
                            })
                            .catch(err => {
                                //console.log(err);
                                GlobalMethods.actionLogger(req, 'ClubAdmin', 'update failed', 'Reseller create failed');
                                res.json({ success: false, message: 'Internal server error.', err: err })
                            })
                    }
                })
                .catch(err => {
                    GlobalMethods.actionLogger(req, 'ClubAdmin', 'update failed', 'Reseller create failed');
                    res.json({ success: false, message: 'Internal server error.', err: err })
                })
        })

    router.route('/club/agent/:id')
        .get(auth, (req, res) => {
            Supporter.findOne({ _id: req.params.id })
                .exec()
                .then(agent => {
                    if (agent && agent._id) {
                        // GlobalMethods.actionLogger(req, 'ClubAdmin', 'view success', 'Agent viewed succesfully');
                        res.json({ success: true, data: agent });
                    } else {
                        //   GlobalMethods.actionLogger(req, 'ClubAdmin', 'view failed', 'Agent viewe failed');
                        res.json({ success: false, message: 'Agent not found.' });
                    }
                })
                .catch(err => {
                    res.json({ success: false, message: 'Internal server error.' })
                })
        })
        .put(auth, (req, res) => {
            Supporter.update({
                _id: req.params.id
            }, {
                $set: {
                    first_name: req.body.first_name,
                    last_name: req.body.last_name,
                    business_name: req.body.business_name,
                    address1: req.body.address1,
                    address2: req.body.address2,
                    town: req.body.town,
                    postcode: req.body.postcode,
                    date_of_birth: req.body.date_of_birth,
                    phone: req.body.phone,
                    reseller_reward: req.body.reseller_reward,
                    country: req.body.country,
                    county: req.body.county,
                    email: req.body.email.toLowerCase(),
                }
            })
                .exec()
                .then(updt => {
                    if (updt && updt.ok) {
                        GlobalMethods.actionLogger(req, 'ClubAdmin', 'update success', 'Agent updated succesfully');
                        res.json({ success: true, message: 'Updated successfully!' });
                    } else {
                        GlobalMethods.actionLogger(req, 'ClubAdmin', 'update failed', 'Agent update failed');
                        res.json({ success: false, message: 'Update failed, Try again latter.' });
                    }
                })
                .catch(err => {
                    res.json({ success: false, message: 'Internal server error.' })
                })
        })


    router.route('/club/agent-activate/:id')
        .put(auth, (req, res) => {
            Supporter.update({
                _id: req.params.id
            }, {
                $set: {
                    is_active: true
                }
            })
                .exec()
                .then(updt => {
                    if (updt && updt.ok) {
                        GlobalMethods.actionLogger(req, 'ClubAdmin', 'update success', 'Agent updated succesfully');
                        res.json({ success: true, message: 'Updated successfully!' });
                    } else {
                        GlobalMethods.actionLogger(req, 'ClubAdmin', 'update failed', 'Agent update failed');
                        res.json({ success: false, message: 'Update failed, Try again latter.' });
                    }
                })
                .catch(err => {
                    res.json({ success: false, message: 'Internal server error.' })
                })
        })

    router.route('/club/agent-deactivate/:id')
        .put(auth, (req, res) => {
            Supporter.update({
                _id: req.params.id
            }, {
                $set: {
                    is_active: false
                }
            })
                .exec()
                .then(updt => {
                    if (updt && updt.ok) {
                        GlobalMethods.actionLogger(req, 'ClubAdmin', 'update success', 'Agent updated succesfully');
                        res.json({ success: true, message: 'Updated successfully!' });
                    } else {
                        GlobalMethods.actionLogger(req, 'ClubAdmin', 'update failed', 'Agent update failed');
                        res.json({ success: false, message: 'Update failed, Try again latter.' });
                    }
                })
                .catch(err => {
                    res.json({ success: false, message: 'Internal server error.' })
                })
        })

    router.route('/club/supporter-exist-number/:phoneNo')
        .get((req, res) => {
            let mobileNo = req.params.phoneNo;
            //console.log("phone ", mobileNo);
            Supporter.findOne({
                phone: mobileNo,
            }).exec()
                .then(supporter => {
                    if (supporter && supporter._id) {
                        res.json({ is_exist: true })

                    }
                    else
                        res.json({ is_exist: false })
                })
        })

    router.route('/club/supporter-exist-email/:email')
        .get((req, res) => {
            let email = req.params.email;
            //console.log("email ", email);
            Supporter.findOne({
                email: email.toLowerCase(),
            }).exec()
                .then(supporter => {
                    if (supporter && supporter._id) {
                        res.json({ is_exist: true })

                    }
                    else
                        res.json({ is_exist: false })
                })
        })

    // router.route('/club/agent-report')
    //     .post(auth, (req, res) => {
    //         ////console.log("req", req.body);
    //         let from_date = new Date(req.body.from_date);
    //         from_date = new Date(from_date.getFullYear(), from_date.getMonth(), from_date.getDate());
    //         let to_date = new Date(req.body.to_date);
    //         to_date = new Date(to_date.getFullYear(), to_date.getMonth(), to_date.getDate() + 1);
    //         //console.log("date", from_date + "  " + to_date);

    //         // let cond = {
    //         //     year: parseInt(params_year)
    //         // }

    //         return Transcation.aggregate([
    //             {
    //                 $lookup:
    //                 {
    //                     from: 'supporters',
    //                     localField: 'created_by',
    //                     foreignField: '_id',
    //                     as: 'supporter'
    //                 }
    //             },
    //             {
    //                 $unwind: '$supporter'
    //             },
    //             {
    //                 $match: {
    //                     created_at: {
    //                         $gte: from_date,
    //                         $lt: to_date
    //                     },
    //                     club_id: mongoose.Types.ObjectId(req.user.club_id),
    //                     supporter_type: 'agent'
    //                 }
    //             },
    //             {
    //                 $project: {
    //                     supporter: "$supporter.first_name",
    //                     new_balance: "$new_balance",
    //                     debit_amount: "$debit_amount",
    //                     credit_amount: "$credit_amount",
    //                     created_at: "$created_at",
    //                     club_id: "$club_id",
    //                     transaction_type: "$trasaction_type"
    //                 }
    //             },
    //             {
    //                 $sort: { _id: -1 }
    //             }

    //         ]).exec()
    //             .then(trans => {
    //                 //console.log("trans", trans);
    //                 res.json({ transaction: trans, success: true })
    //             })

    //     })

    router.route('/club/agent-report')
        .post(auth, (req, res) => {
            let result = {};
            let from_date = new Date(req.body.from_date);
            from_date.setHours(0, 0, 0, 0);
            //  from_date = new Date(from_date.getFullYear(), from_date.getMonth(), from_date.getDate());
            let to_date = new Date(req.body.to_date);
            // to_date = new Date(to_date.getFullYear(), to_date.getMonth(), to_date.getDate() + 1);
            to_date.setHours(23, 59, 59, 999);
            // //console.log("date player", req.user.club_id + "  " + to_date);

            let group = {};
            group['$group'] = {
                supporter_id: "$supporter_id"

            }

            return Transcation.aggregate([
                {
                    $lookup:
                    {
                        from: 'supporters',
                        localField: 'created_by',
                        foreignField: '_id',
                        as: 'supporter'
                    }
                },
                {
                    $unwind: '$supporter'
                },
                // {
                //     $match: {supporter}
                // },

                {
                    $match: {
                        created_at: {
                            $gte: from_date,
                            $lt: to_date
                        },
                        club_id: mongoose.Types.ObjectId(req.user.club_id),
                        supporter_type: 'agent'

                    }
                },
                {
                    $project: {
                        supporter_id: "$supporter._id",
                        first_name: "$supporter.first_name",
                        last_name: "$supporter.last_name",
                        new_balance: "$new_balance",
                        debit_amount: "$debit_amount",
                        credit_amount: "$credit_amount",
                        commission: "$commission",
                        created_at: "$created_at",
                        club_id: "$club_id",
                        transaction_type: "$trasaction_type"
                    }
                },
                {
                    $sort: { created_at: 1 }
                },
                {
                    $group: {
                        _id: { supporter_id: '$supporter_id', first_name: "$first_name", last_name: "$last_name", club_id: "$club_id" },
                        total_debit: { $sum: "$debit_amount" },
                        total_credit: { $sum: "$credit_amount" },
                        total_commission: { $sum: "$commission" },
                        balance: { $last: '$new_balance' },
                        transaction_type: { $last: '$transaction_type' },
                        created_at: { $last: '$created_at' },
                    }
                },

                {
                    $sort: { _id: -1 }
                }

            ]).exec()
                .then(trans => {
                    result.transaction = trans;

                    return getResellerNumbers(req, 'active')
                        .then(activeResellers => {
                            result.activeResellerscount = activeResellers.length;
                            //   console.log("activeResellers.length", activeResellers.length);
                            //  res.json({ transaction: trans, success: true })
                            return getResellerNumbers(req, 'inactive')
                                .then(inactiveResellers => {
                                    result.inactiveResellerscount = inactiveResellers.length;
                                    return getResellerNumbers(req, 'new')
                                        .then(newResellers => {
                                            result.newResellerscount = newResellers.length;
                                            return getSalesChart(req)
                                                .then(sales => {
                                                    result.sales = sales;
                                                    res.json({ result: result, success: true })
                                                }).catch(err => {
                                                    res.json({ success: false, result: err });
                                                })

                                        }).catch(err => {
                                            res.json({ success: false, result: err });
                                        })
                                }).catch(err => {
                                    res.json({ success: false, users: err });
                                })
                        }).catch(err => {
                            res.json({ success: false, users: err });
                        })

                }).catch(err => {
                    res.json({ success: false, users: err });
                })

        })


    router.route('/club/reseller-result/download')
        .get(auth, (req, res) => {
            let token = req.cookies.token || req.headers.token;
            let from_date = new Date(req.query.from_date);
            //  from_date = from_date.getFullYear() + '-' + (from_date.getMonth() + 1) + '-' + from_date.getDate();
            //  console.log(from_date)
            let to_date = new Date(req.query.to_date);
            //  to_date = to_date.getFullYear() + '-' + (to_date.getMonth() + 1) + '-' + to_date.getDate();
            let table_columns = JSON.stringify(req.query.table_columns);
            let page_url = `${process.env.APP_DOMAIN}/#/report-print/club/resellers-report?from_date=${from_date}
            &to_date=${to_date}&table_columns=${table_columns}&club_id=${req.user.club_id}&auth_token=${token}`;
            // console.log("url",page_url);
            GlobalMethods.printPDF(page_url, 1000)
                .then(pdf => {
                    res.set({ 'Content-Type': 'application/pdf', 'Content-Length': pdf.length })
                    res.send(pdf)
                })
        })

    router.route('/club/club-info/:id')
        .get((req, res) => {
            let id = req.params.id;

            Club.aggregate([
                {
                    $match: {
                        _id: mongoose.Types.ObjectId(id)
                    }
                },
                { $unwind: '$supporting_teams' },
                {
                    "$project": {
                        _id: 0,
                        supporting_teams: "$supporting_teams",
                    }
                },
                {
                    $sort: {
                        'supporting_teams.seq': 1
                    }
                }
            ])
                // Club.findOne({
                //     _id: id
                // })
                //     .select({ supporting_teams: 1 })
                //     .sort({ 'supporting_teams.seq': 1 })
                .exec()
                .then(club => {
                    console.log("club", club);
                    if (club) {
                        res.json({ supporting_teams: club, success: true })

                    }
                    else
                        res.json({ success: false, supporting_teams: club })
                })
                .catch(err => {
                    res.json({ success: false, supporting_teams: err });
                })
        })


    router.route('/club/reseller-list')
        .get(auth, (req, res) => {
            let cond = {};
            let result = new Object();
            cond['supporter_type'] = 'agent';
            cond['agent_type'] = 'club_reseller';
            cond['favourite_club'] = mongoose.Types.ObjectId(req.user.club_id);
            cond['is_active'] = true;

            return Supporter.aggregate([
                {
                    $lookup:
                    {
                        from: 'balances',
                        localField: '_id',
                        foreignField: 'supporter_id',
                        as: 'amount'
                    }
                },
                {
                    $unwind: '$amount'
                },
                {
                    $lookup:
                    {
                        from: 'clubs',
                        localField: 'favourite_club',
                        foreignField: '_id',
                        as: 'club'
                    }
                },
                {
                    $unwind: '$club'
                },
                {
                    $match: cond
                },
                {
                    $project: {
                        first_name: "$first_name",
                        last_name: "$last_name",
                        business_name: "$business_name",
                        address1: "$address1",
                        address2: "$address2",
                        town: "$town",
                        country: "$country",
                        county: "$county",
                        phone: "$phone",
                        postcode: "$postcode",
                        email: "$email",
                        email: "$email",
                        date_of_birth: "$date_of_birth",
                        supporter_type: "$supporter_type",
                        balance: "$amount.balance",
                        purchase: "$amount.purchase",
                        reseller_reward: "$reseller_reward",
                        is_active: "$is_active",
                        supporting_teams: "$club.supporting_teams"
                    }
                },
                {
                    $sort: { _id: -1 }
                }
            ])
                .exec()
                .then(supporters => {
                    result.supporters = supporters;
                    res.json({ success: true, result: supporters });
                })
                .catch(err => {
                    res.json({ success: false, result: err });
                })
        })
})


function getResellerNumbers(req, type) {
    return new Promise((resolve, reject) => {

        let compareDate = new Date();
        let cond = {}
        if (type == 'active') {
            compareDate.setDate(compareDate.getDate() - 42);
            compareDate.setHours(0, 0, 0, 0);
            cond['sales_info.sold_at'] = { $gte: new Date(compareDate) }
        }
        else if (type == 'new') {
            compareDate.setDate(compareDate.getDate() - 7);
            compareDate.setHours(0, 0, 0, 0);
            cond['sales_info.sold_at'] = { $gte: new Date(compareDate) }
        }
        else {
            compareDate.setDate(compareDate.getDate() - 84);
            compareDate.setHours(0, 0, 0, 0);
            cond['sales_info.sold_at'] = { $gte: new Date(compareDate) }
        }
        cond['club_id'] = mongoose.Types.ObjectId(req.user.club_id)
        //  cond['is_agent_sales'] = false
        try {
            Sales.aggregate([
                {
                    $match: cond
                },

                {
                    $group: {
                        _id: { supporter_id: '$supporter_id' },
                        number_of_players: { $sum: 1 }
                    }
                },


            ])
                .exec()
                .then(result => {

                    let cond = {};
                    cond['supporter_type'] = 'agent';
                    cond['agent_type'] = 'club_reseller';
                    cond['favourite_club'] = mongoose.Types.ObjectId(req.user.club_id);
                    Supporter.aggregate([

                        {
                            $match: cond
                        },
                        {
                            $sort: { _id: -1 }
                        }

                    ]).
                        exec()
                        .then(supporters => {
                            // console.log("supporters", supporters);
                            let filtSupp = supporters.filter(supporter => {
                                //  //console.log("supporter",supporter.active_clubs.status+ "  "+ supporter._id);
                                if (type == 'inactive') {
                                    let ret = containsObject(supporter._id, result);
                                    if (!ret)
                                        ////console.log(ret)
                                        return supporter;
                                }

                                else if (type == 'active' || type == 'new') {
                                    if (supporter.is_active) {
                                        let ret = containsObject(supporter._id, result);
                                        if (ret)
                                            return supporter;
                                    }
                                }
                            });
                            resolve(filtSupp);
                        })
                        .catch(err => {
                            //console.log("Error2", err);
                            reject(err)
                        })


                    //   }



                }).catch(err => {
                    //console.log("Error2", err);
                    reject(err)
                })
        } catch (error) {
            //console.log("Error3", error);
            reject(error);
        }
    })
}

function getSalesChart(req) {
    return new Promise((resolve, reject) => {
        let compareDate = new Date();
        let cond = {}

        cond['supporter_type'] = 'agent';
        cond['agent_type'] = 'club_reseller';
        cond['favourite_club'] = mongoose.Types.ObjectId(req.user.club_id);
        cond['is_active'] = true;

        try {

            Supporter.find(cond)
                .exec()
                .then(supports => {
                    let supporter_ids = supports.map(supporter => { return supporter._id });
                 //   console.log("supporter_ids", supporter_ids);
                    return Balance.aggregate([
                        {
                            $match: {
                                supporter_id: { $in: supporter_ids }
                            }
                        },
                        {
                            $lookup: {
                                from: 'supporters',
                                localField: 'supporter_id',
                                foreignField: '_id',
                                as: 'supporter'
                            }
                        },
                        {
                            $unwind: "$supporter"
                        },
                        {
                            $project: {
                                purchase: "$purchase",
                                supporter_id: "$supporter._id",
                                first_name: "$supporter.first_name"
                            }
                        }
                    ])
                        .then(sales => {
                        //    console.log("sales", sales);
                            resolve(sales);
                        })
                        .catch(err => {
                            //console.log("Error2", err);
                            reject(err)
                        })

                }).catch(err => {
                    //console.log("Error2", err);
                    reject(err)
                })
        } catch (error) {
            //console.log("Error3", error);
            reject(error);
        }

    })
}


function containsObject(obj, list) {
    var i;
    let send = false;
    for (i = 0; i < list.length; i++) {
        if (list[i]._id.supporter_id.equals(obj)) {
            send = true;
            break;
        }
    }

    return send;
}