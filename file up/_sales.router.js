const Sales = require('../../../models/sales.model');
const Transaction = require('../../../models/transaction.model');
const LottoResult = require('../../../models/lotto-result.model');
const PrizeResult = require('../../../models/prize-result.model');
const Prize = require('../../../models/prize.model');
const SmsLog = require('../../../models/sms-log.model');
const Club = require('../../../models/club.model');
const Company = require('../../../models/company.model');
const Balance = require('../../../models/balance.model');
const Supporter = require('../../../models/supporter.model');
const Jackpot = require('../../../models/jackpot.model');
const MessageTemplate = require('../../../models/message-template.model');

const smartMoments = require('../moment.service');
const mongoose = require('mongoose');
const GlobalMethods = require('../api.service');
const TemplatesShared = require('../templates-shared');
const moment = require('moment');
const { getNextSequence, stringTemplateParser } = require('../shared');
const fs = require('fs')

module.exports = ((app, router, auth) => {
    router.route('/club/sales')
        .get(auth, (req, res) => {
            let d = new Date();
            let params_month = req.query.month ? parseInt(req.query.month) + 1 : d.getMonth() + 1;
            let params_year = req.query.year ? parseInt(req.query.year) : d.getFullYear();
            let cond = {
                year: parseInt(params_year),
                month: parseInt(params_month),
                club_id: mongoose.Types.ObjectId(req.user.club_id)
            }
            if (req.query.type != 'all') {
                cond['debited_for'] = req.query.type;
            }
            Transaction.aggregate([
                {
                    $project: {
                        club_id: "$club_id",
                        created_at: "$created_at",
                        credit_amount: "$credit_amount",
                        debit_amount: "$debit_amount",
                        amount: { $abs: { $subtract: ["$debit_amount", "$credit_amount"] } },
                        transaction_type: "$transaction_type",
                        description: "$description",
                        debited_for: "$debited_for",
                        year: { $year: "$created_at" },
                        month: { $month: "$created_at" }
                    }
                },
                {
                    $match: cond
                },
                {
                    $group: {
                        _id: { week: { $week: "$created_at" }, description: "$description" },
                        amount: { $sum: "$amount" },
                        current_date: { $first: "$created_at" }
                    }
                },
                {
                    $group: {
                        _id: "$_id.week",
                        sales: {
                            $push: {
                                sale_head: "$_id.description",
                                amount: "$amount"
                            }
                        }
                    }
                },
                {
                    $sort: {
                        _id: 1
                    }
                }
            ])
                .exec()
                .then(result => {
                    GlobalMethods.actionLogger(req, 'ClubAdmin', 'view success', 'Sales viewed succesfully');
                    res.json(result);
                })
                .catch(err => {
                    GlobalMethods.actionLogger(req, 'ClubAdmin', 'view failed', 'Sales view failed');
                    res.send(err);
                })
        })

    router.route('/club/sales/sales-report')
        .post(auth, (req, res) => {
            let info = new Object();
            let draw_cond = new Object();
            let lotto_draws = [];
            if (req.body.filter_with_week && req.body.with_number_of_week) {
                let drawNum = parseInt(req.body.number_of_week);
                LottoResult.find({ club_id: req.user.club_id })
                    .sort({ _id: -1 })
                    .limit(drawNum)
                    .exec()
                    .then(lttoResult => {
                        lotto_draws = lttoResult;
                        return PrizeResult.find({ club_id: req.user.club_id })
                            .sort({ _id: -1 })
                            .limit(drawNum)
                    })
                    .then(przResult => {
                        if (lotto_draws.length > 0) {
                            let draw_numbers = lotto_draws.map(x => { return x.draw_number });
                            draw_cond.draw_number = { $in: draw_numbers };
                            draw_cond.club_id = lotto_draws[0].club_id;
                        } else if (przResult.length > 0) {
                            let draw_numbers = przResult.map(x => { return x.draw_number });
                            draw_cond.draw_number = { $in: draw_numbers };
                            draw_cond.club_id = przResult[0].club_id;
                        } else {
                            draw_cond.draw_number = { $in: [0] };
                        }
                        return getSalesData(draw_cond);
                    })
                    .then(data => {
                        info = data;
                        return LottoResult.find({ club_id: req.user.club_id })
                    })
                    .then(alLottoDraw => {
                        let all_draw_no = alLottoDraw.map(x => { return x.draw_number })
                        res.json({ success: true, data: info, draw_list: all_draw_no });
                    })
                    .catch(err => {
                        res.json(err)
                    })
            } else if (req.body.filter_with_week && req.body.with_no_of_week) {

                let drawNum = parseInt(req.body.no_of_week);
                LottoResult.find({ club_id: req.user.club_id, draw_number: drawNum })
                    .exec()
                    .then(lttoResult => {
                        lotto_draws = lttoResult;
                        return PrizeResult.find({ club_id: req.user.club_id, draw_number: drawNum })
                    })
                    .then(przResult => {
                        if (lotto_draws.length > 0) {
                            let draw_numbers = lotto_draws.map(x => { return x.draw_number });
                            draw_cond.draw_number = { $in: draw_numbers };
                            draw_cond.club_id = lotto_draws[0].club_id;
                        } else if (przResult.length > 0) {
                            let draw_numbers = przResult.map(x => { return x.draw_number });
                            draw_cond.draw_number = { $in: draw_numbers };
                            draw_cond.club_id = przResult[0].club_id;
                        } else {
                            draw_cond.draw_number = { $in: [0] };
                        }
                        return getSalesData(draw_cond);
                    })
                    .then(data => {
                        info = data;
                        return LottoResult.find({ club_id: req.user.club_id })
                    })
                    .then(alLottoDraw => {
                        let all_draw_no = alLottoDraw.map(x => { return x.draw_number })
                        res.json({ success: true, data: info, draw_list: all_draw_no });
                    })
                    .catch(err => {
                        res.json(err)
                    })
            } else {
                let from_date = req.body.from_date ? new Date(req.body.from_date) : new Date();
                from_date.setHours(0, 0, 0, 0);
                let to_date = req.body.to_date ? new Date(req.body.to_date) : new Date();
                to_date.setHours(23, 59, 59, 999);

                draw_cond.generated_at = { $gt: new Date(from_date), $lte: new Date(to_date) };
                draw_cond.club_id = mongoose.Types.ObjectId(req.user.club_id);

                getSalesData(draw_cond)
                    .then(data => {
                        info = data;
                        return LottoResult.find({ club_id: req.user.club_id })
                    })
                    .then(alLottoDraw => {
                        let all_draw_no = alLottoDraw.map(x => { return x.draw_number })
                        res.json({ success: true, data: info, draw_list: all_draw_no });
                    })
                    .catch(err => {
                        res.json(err)
                    })
            }
        })

    router.route('/report/club/sales-report')
        .post((req, res) => {

            let info = new Object();
            let draw_cond = new Object();
            let lotto_draws = [];

            req.body.filter_with_week = req.body.filter_with_week && req.body.filter_with_week == 'true' ? true : false;
            req.body.with_number_of_week = req.body.with_number_of_week && req.body.with_number_of_week == 'true' ? true : false;
            req.body.with_no_of_week = req.body.with_no_of_week && req.body.with_no_of_week == 'true' ? true : false;

            if (req.body.filter_with_week && req.body.with_number_of_week) {
                let drawNum = parseInt(req.body.number_of_week);
                LottoResult.find({ club_id: req.body.club_id })
                    .sort({ _id: -1 })
                    .limit(drawNum)
                    .exec()
                    .then(lttoResult => {
                        lotto_draws = lttoResult;
                        return PrizeResult.find({ club_id: req.body.club_id })
                            .sort({ _id: -1 })
                            .limit(drawNum)
                    })
                    .then(przResult => {
                        if (lotto_draws.length > 0) {
                            let draw_numbers = lotto_draws.map(x => { return x.draw_number });
                            draw_cond.draw_number = { $in: draw_numbers };
                            draw_cond.club_id = lotto_draws[0].club_id;
                        } else if (przResult.length > 0) {
                            let draw_numbers = przResult.map(x => { return x.draw_number });
                            draw_cond.draw_number = { $in: draw_numbers };
                            draw_cond.club_id = przResult[0].club_id;
                        } else {
                            draw_cond.draw_number = { $in: [0] };
                        }
                        return getSalesData(draw_cond);
                    })
                    .then(data => {
                        info = data;
                        return Club.findOne({ _id: req.body.club_id })
                            .select({ org_name: 1, logo: 1, address1: 1, town: 1, postcode: 1, county: 1 })
                    })
                    .then(club => {
                        res.json({ success: true, data: info, club: club });
                    })
                    .catch(err => {
                        res.json(err)
                    })
            } else if (req.body.filter_with_week && req.body.with_no_of_week) {

                let drawNum = parseInt(req.body.no_of_week);
                LottoResult.find({ club_id: req.body.club_id, draw_number: drawNum })
                    .exec()
                    .then(lttoResult => {
                        lotto_draws = lttoResult;
                        return PrizeResult.find({ club_id: req.body.club_id, draw_number: drawNum })
                    })
                    .then(przResult => {
                        if (lotto_draws.length > 0) {
                            let draw_numbers = lotto_draws.map(x => { return x.draw_number });
                            draw_cond.draw_number = { $in: draw_numbers };
                            draw_cond.club_id = lotto_draws[0].club_id;
                        } else if (przResult.length > 0) {
                            let draw_numbers = przResult.map(x => { return x.draw_number });
                            draw_cond.draw_number = { $in: draw_numbers };
                            draw_cond.club_id = przResult[0].club_id;
                        } else {
                            draw_cond.draw_number = { $in: [0] };
                        }
                        return getSalesData(draw_cond);
                    })
                    .then(data => {
                        info = data;
                        return Club.findOne({ _id: req.body.club_id })
                            .select({ org_name: 1, logo: 1, address1: 1, town: 1, postcode: 1, county: 1 })
                    })
                    .then(club => {
                        res.json({ success: true, data: info, club: club });
                    })
                    .catch(err => {
                        res.json(err)
                    })
            } else {
                let from_date = req.body.from_date ? new Date(req.body.from_date) : new Date();
                from_date.setHours(0, 0, 0, 0);
                let to_date = req.body.to_date ? new Date(req.body.to_date) : new Date();
                to_date.setHours(23, 59, 59, 999);

                draw_cond.generated_at = { $gt: new Date(from_date), $lte: new Date(to_date) };
                draw_cond.club_id = mongoose.Types.ObjectId(req.body.club_id);

                getSalesData(draw_cond)
                    .then(data => {
                        info = data;
                        return Club.findOne({ _id: req.body.club_id })
                            .select({ org_name: 1, logo: 1, address1: 1, town: 1, postcode: 1, county: 1 })
                    })
                    .then(club => {
                        res.json({ success: true, data: info, club: club });
                    })
                    .catch(err => {
                        res.json(err)
                    })
            }
        })


    function getSalesData(draw_cond) {
        return new Promise((resolve, reject) => {
            let lotto_draws = [];
            let prize_draws = [];
            LottoResult.aggregate([
                {
                    $match: draw_cond
                },
                {
                    $project: {
                        general_sales: "$general_sales",
                        club_reseller_sales: "$agent_sales",
                        global_reseller_sales: "$global_agent_sales",
                        gross_sales: "$total_sales",
                        sl_fee: "$transaction_cost",
                        net_amount: { $subtract: ["$total_sales", "$transaction_cost"] },
                        draw_number: "$draw_number"
                    }
                }
            ])
                .exec()
                .then(draws => {
                    lotto_draws = draws;
                    // resolve(data)
                    return PrizeResult.aggregate([
                        {
                            $match: draw_cond
                        },
                        {
                            $project: {
                                general_sales: "$general_sales",
                                club_reseller_sales: "$agent_sales",
                                global_reseller_sales: "$global_agent_sales",
                                gross_sales: "$total_sales",
                                sl_fee: "$transaction_cost",
                                net_amount: { $subtract: ["$total_sales", "$transaction_cost"] },
                                draw_number: "$draw_number"
                            }
                        }
                    ])
                })
                .then(draws => {
                    prize_draws = draws;
                    let base_draws = lotto_draws.length >= prize_draws.length ? lotto_draws : prize_draws;
                    let other_draw = lotto_draws.length >= prize_draws.length ? prize_draws : lotto_draws;
                    base_draws = base_draws.map(draw => {
                        let draw_obj = other_draw.find(x => x.draw_number == draw.draw_number);
                        if (draw_obj) {
                            draw.general_sales += draw_obj.general_sales;
                            draw.club_reseller_sales += draw_obj.club_reseller_sales;
                            draw.global_reseller_sales += draw_obj.global_reseller_sales;
                            draw.sl_fee += draw_obj.sl_fee;
                            draw.net_amount += draw_obj.net_amount;
                        }
                        return draw;
                    })
                    resolve(base_draws)
                })
                .catch(err => {
                    console.log(err);
                    reject(err)
                })
        })
    }

    router.route('/club/sales/lotto-report')
        .post(auth, (req, res) => {
            let info = new Object();
            let draw_cond = new Object();
            let date_cond = new Object();
            let lotto_draws = [];
            if (req.body.filter_with_week && req.body.with_number_of_week) {
                let drawNum = parseInt(req.body.number_of_week);
                LottoResult.find({ club_id: req.user.club_id })
                    .sort({ _id: -1 })
                    .limit(drawNum)
                    .exec()
                    .then(lttoResult => {
                        lotto_draws = lttoResult;
                        return PrizeResult.find({ club_id: req.user.club_id })
                            .sort({ _id: -1 })
                            .limit(drawNum)
                    })
                    .then(przResult => {
                        if (lotto_draws.length > 0) {
                            let draw_numbers = lotto_draws.map(x => { return x.draw_number });
                            draw_cond.draw_number = { $in: draw_numbers };
                            draw_cond.club_id = lotto_draws[0].club_id;

                            let date_from = new Date(lotto_draws[lotto_draws.length - 1].draw_activated_at);
                            let date_to = new Date(lotto_draws[0].generated_at);
                            let addingMins = moment(date_to).add(5, 'm').toDate();
                            date_cond.created_at = { $gte: date_from, $lte: addingMins };
                            date_cond.club_id = lotto_draws[0].club_id;
                        } else if (przResult.length > 0) {
                            let draw_numbers = przResult.map(x => { return x.draw_number });
                            draw_cond.draw_number = { $in: draw_numbers };
                            draw_cond.club_id = przResult[0].club_id;

                            let date_from = new Date(przResult[przResult.length - 1].draw_activated_at);
                            let date_to = new Date(przResult[0].generated_at);
                            let addingMins = moment(date_to).add(5, 'm').toDate();
                            date_cond.created_at = { $gte: date_from, $lte: addingMins };
                            date_cond.club_id = przResult[0].club_id;
                        } else {
                            draw_cond.draw_number = { $in: [0] };
                            date_cond.created_at = new Date(0, 0, 0);
                        }
                        return getSalesAndExpenses(draw_cond, date_cond);
                    })
                    .then(data => {
                        info = data;
                        return LottoResult.find({ club_id: req.user.club_id })
                    })
                    .then(alLottoDraw => {
                        let all_draw_no = alLottoDraw.map(x => { return x.draw_number })
                        res.json({ success: true, data: info, draw_list: all_draw_no });
                    })
                    .catch(err => {
                        res.json(err)
                    })
            } else if (req.body.filter_with_week && req.body.with_no_of_week) {
                let drawNum = parseInt(req.body.no_of_week);
                LottoResult.find({ club_id: req.user.club_id, draw_number: drawNum })
                    .exec()
                    .then(lttoResult => {
                        lotto_draws = lttoResult;
                        return PrizeResult.find({ club_id: req.user.club_id, draw_number: drawNum })
                    })
                    .then(przResult => {
                        if (lotto_draws.length > 0) {
                            let draw_numbers = lotto_draws.map(x => { return x.draw_number });
                            draw_cond.draw_number = { $in: draw_numbers };
                            draw_cond.club_id = lotto_draws[0].club_id;

                            let date_from = new Date(lotto_draws[0].draw_activated_at);
                            let date_to = new Date(lotto_draws[lotto_draws.length - 1].generated_at);
                            let addingMins = moment(date_to).add(5, 'm').toDate();
                            date_cond.created_at = { $gte: date_from, $lte: addingMins };
                            date_cond.club_id = lotto_draws[0].club_id;
                        } else if (przResult.length > 0) {
                            let draw_numbers = przResult.map(x => { return x.draw_number });
                            draw_cond.draw_number = { $in: draw_numbers };
                            draw_cond.club_id = przResult[0].club_id;

                            let date_from = new Date(przResult[0].draw_activated_at);
                            let date_to = new Date(przResult[przResult.length - 1].generated_at);
                            let addingMins = moment(date_to).add(5, 'm').toDate();
                            date_cond.created_at = { $gte: date_from, $lte: addingMins };
                            date_cond.club_id = przResult[0].club_id;
                        } else {
                            draw_cond.draw_number = { $in: [0] };
                            date_cond.created_at = new Date(0, 0, 0);
                        }
                        return getSalesAndExpenses(draw_cond, date_cond);
                    })
                    .then(data => {
                        info = data;
                        return LottoResult.find({ club_id: req.user.club_id })
                    })
                    .then(alLottoDraw => {
                        let all_draw_no = alLottoDraw.map(x => { return x.draw_number })
                        res.json({ success: true, data: info, draw_list: all_draw_no });
                    })
                    .catch(err => {
                        res.json(err)
                    })
            } else {
                let from_date = req.body.from_date ? new Date(req.body.from_date) : new Date();
                from_date.setHours(0, 0, 0, 0);
                let to_date = req.body.to_date ? new Date(req.body.to_date) : new Date();
                to_date.setHours(23, 59, 59, 999);

                draw_cond.generated_at = { $gt: new Date(from_date), $lte: new Date(to_date) };
                draw_cond.club_id = mongoose.Types.ObjectId(req.user.club_id);

                date_cond.created_at = { $gt: new Date(from_date), $lte: new Date(to_date) };
                date_cond.club_id = mongoose.Types.ObjectId(req.user.club_id);

                getSalesAndExpenses(draw_cond, date_cond)
                    .then(data => {
                        info = data;
                        return LottoResult.find({ club_id: req.user.club_id })
                    })
                    .then(alLottoDraw => {
                        let all_draw_no = alLottoDraw.map(x => { return x.draw_number })
                        res.json({ success: true, data: info, draw_list: all_draw_no });
                    })
                    .catch(err => {
                        res.json(err)
                    })
            }
        })

    router.route('/report/club/lotto-report')
        .post((req, res) => {

            let info = new Object();
            let draw_cond = new Object();
            let date_cond = new Object();

            let reporting_date_from;
            let reporting_date_to;
            let lotto_draws = [];

            req.body.filter_with_week = req.body.filter_with_week && req.body.filter_with_week == 'true' ? true : false;
            req.body.with_number_of_week = req.body.with_number_of_week && req.body.with_number_of_week == 'true' ? true : false;
            req.body.with_no_of_week = req.body.with_no_of_week && req.body.with_no_of_week == 'true' ? true : false;

            if (req.body.filter_with_week && req.body.with_number_of_week) {
                let drawNum = parseInt(req.body.number_of_week);
                LottoResult.find({ club_id: req.body.club_id })
                    .sort({ _id: -1 })
                    .limit(drawNum)
                    .exec()
                    .then(lttoResult => {
                        lotto_draws = lttoResult;
                        return PrizeResult.find({ club_id: req.body.club_id })
                            .sort({ _id: -1 })
                            .limit(drawNum)
                    })
                    .then(przResult => {
                        if (lotto_draws.length > 0) {
                            let draw_numbers = lotto_draws.map(x => { return x.draw_number });
                            draw_cond.draw_number = { $in: draw_numbers };
                            draw_cond.club_id = lotto_draws[0].club_id;

                            let date_from = new Date(lotto_draws[lotto_draws.length - 1].draw_activated_at);
                            let date_to = new Date(lotto_draws[0].generated_at);

                            reporting_date_from = date_from;
                            reporting_date_to = date_to;

                            let addingMins = moment(date_to).add(5, 'm').toDate();
                            date_cond.created_at = { $gte: date_from, $lte: addingMins };
                            date_cond.club_id = lotto_draws[0].club_id;
                        } else if (przResult.length > 0) {
                            let draw_numbers = przResult.map(x => { return x.draw_number });
                            draw_cond.draw_number = { $in: draw_numbers };
                            draw_cond.club_id = przResult[0].club_id;

                            let date_from = new Date(przResult[przResult.length - 1].draw_activated_at);
                            let date_to = new Date(przResult[0].generated_at);

                            reporting_date_from = date_from;
                            reporting_date_to = date_to;

                            let addingMins = moment(date_to).add(5, 'm').toDate();
                            date_cond.created_at = { $gte: date_from, $lte: addingMins };
                            date_cond.club_id = przResult[0].club_id;
                        } else {
                            draw_cond.draw_number = { $in: [0] };
                            date_cond.created_at = new Date(0, 0, 0);
                        }
                        return getSalesAndExpenses(draw_cond, date_cond);
                    })
                    .then(data => {
                        info = data;
                        return Club.findOne({ _id: req.body.club_id })
                            .select({ org_name: 1, logo: 1, address1: 1, town: 1, postcode: 1, county: 1 })
                    })
                    .then(club => {
                        res.json({
                            success: true,
                            data: info,
                            club: club,
                            reporting_date_from: reporting_date_from,
                            reporting_date_to: reporting_date_to
                        });
                    })
                    .catch(err => {
                        res.json(err)
                    })
            } else if (req.body.filter_with_week && req.body.with_no_of_week) {
                let drawNum = parseInt(req.body.no_of_week);
                LottoResult.find({ club_id: req.body.club_id, draw_number: drawNum })
                    .exec()
                    .then(lttoResult => {
                        lotto_draws = lttoResult;
                        return PrizeResult.find({ club_id: req.body.club_id, draw_number: drawNum })
                    })
                    .then(przResult => {
                        if (lotto_draws.length > 0) {
                            let draw_numbers = lotto_draws.map(x => { return x.draw_number });
                            draw_cond.draw_number = { $in: draw_numbers };
                            draw_cond.club_id = lotto_draws[0].club_id;

                            let date_from = new Date(lotto_draws[0].draw_activated_at);
                            let date_to = new Date(lotto_draws[lotto_draws.length - 1].generated_at);

                            reporting_date_from = date_from;
                            reporting_date_to = date_to;

                            let addingMins = moment(date_to).add(5, 'm').toDate();
                            date_cond.created_at = { $gte: date_from, $lte: addingMins };
                            date_cond.club_id = lotto_draws[0].club_id;
                        } else if (przResult.length > 0) {
                            let draw_numbers = przResult.map(x => { return x.draw_number });
                            draw_cond.draw_number = { $in: draw_numbers };
                            draw_cond.club_id = przResult[0].club_id;

                            let date_from = new Date(przResult[0].draw_activated_at);
                            let date_to = new Date(przResult[przResult.length - 1].generated_at);

                            reporting_date_from = date_from;
                            reporting_date_to = date_to;

                            let addingMins = moment(date_to).add(5, 'm').toDate();
                            date_cond.created_at = { $gte: date_from, $lte: addingMins };
                            date_cond.club_id = przResult[0].club_id;
                        } else {
                            draw_cond.draw_number = { $in: [0] };
                            date_cond.created_at = new Date(0, 0, 0);
                        }
                        return getSalesAndExpenses(draw_cond, date_cond);
                    })
                    .then(data => {
                        info = data;
                        return Club.findOne({ _id: req.body.club_id })
                            .select({ org_name: 1, logo: 1, address1: 1, town: 1, postcode: 1, county: 1 })
                    })
                    .then(club => {
                        res.json({
                            success: true,
                            data: info,
                            club: club,
                            reporting_date_from: reporting_date_from,
                            reporting_date_to: reporting_date_to
                        });
                    })
                    .catch(err => {
                        res.json(err)
                    })
            } else {
                let from_date = req.body.from_date ? new Date(req.body.from_date) : new Date();
                from_date.setHours(0, 0, 0, 0);
                let to_date = req.body.to_date ? new Date(req.body.to_date) : new Date();
                to_date.setHours(23, 59, 59, 999);

                draw_cond.generated_at = { $gt: new Date(from_date), $lte: new Date(to_date) };
                draw_cond.club_id = mongoose.Types.ObjectId(req.body.club_id);

                date_cond.created_at = { $gt: new Date(from_date), $lte: new Date(to_date) };
                date_cond.club_id = mongoose.Types.ObjectId(req.body.club_id);

                reporting_date_from = from_date;
                reporting_date_to = to_date;

                getSalesAndExpenses(draw_cond, date_cond)
                    .then(data => {
                        info = data;
                        return Club.findOne({ _id: req.body.club_id })
                            .select({ org_name: 1, logo: 1, address1: 1, town: 1, postcode: 1, county: 1 })
                    })
                    .then(club => {
                        res.json({
                            success: true,
                            data: info,
                            club: club,
                            reporting_date_from: reporting_date_from,
                            reporting_date_to: reporting_date_to
                        });
                    })
                    .catch(err => {
                        res.json(err)
                    })
            }
        })

    function getSalesAndExpenses(draw_cond, date_cond) {
        return new Promise((resolve, reject) => {
            let result = {
                lotto_sales: 0,
                lotto_sl_fees: 0,
                lotto_sl_fees_pct: 0,
                lotto_global_reseller_handling_fee: 0,
                lotto_global_reseller_sales: 0,
                lotto_club_resseler_sales: 0,
                lotto_online_sales: 0,
                lotto_online_sales_pct: 0,
                lotto_club_resseler_sales_pct: 0,

                lotto_sms_fee: 0,
                lotto_sms_fee_pct: 0,

                lotto_winning_amount: 0,
                lotto_three_winning_amount: 0,
                lotto_two_winning_amount: 0,
                lotto_lucky_dip_winning_amount: 0,
                lotto_incremented_amount: 0,
                lotto_reserve_amount: 0,
                lotto_three_winning_amount_pct: 0,
                lotto_two_winning_amount_pct: 0,
                lotto_lucky_dip_winning_amount_pct: 0,
                lotto_incremented_amount_pct: 0,
                lotto_reserve_amount_pct: 0,

                prize_projected_draw_amount: 0,
                prize_sales: 0,
                prize_sl_fees: 0,
                prize_sl_fees_pct: 0,
                prize_global_reseller_handling_fee: 0,
                prize_global_reseller_sales: 0,
                prize_club_resseler_sales: 0,
                prize_online_sales: 0,
                prize_club_resseler_sales_pct: 0,
                prize_online_sales_pct: 0,
                total_prize_cost: 0,
                prize_sms_fee: 0,
                prize_sms_fee_pct: 0,

                signup_credit: 0,
                signup_credit_pct: 0,

                total_income: 0,
                cost_of_goods: 0,
                cost_of_goods_pct: 0,
                gross_profit: 0,
                gross_profit_pct: 0,

                total_expense: 0,
                total_expense_pct: 0,

                net_profit: 0,
                net_profit_pct: 0
            };
            LottoResult.aggregate([
                {
                    $match: draw_cond
                },
                {
                    $group: {
                        _id: '',
                        lotto_club_resseler_sales: { $sum: "$agent_sales" },
                        lotto_global_reseller_handling_fee: { $sum: "$global_agent_handling_fee" },
                        lotto_global_reseller_sales: { $sum: "$global_agent_sales" },
                        lotto_incremented_amount: { $sum: "$jackpot_incremented_amount" },
                        lotto_lucky_dip_winning_amount: { $sum: "$lucky_deep_winner_total_amount" },
                        lotto_online_sales: { $sum: "$general_sales" },
                        lotto_reserve_amount: { $sum: "$current_reserve_amount" },
                        lotto_sales: { $sum: "$total_sales" },
                        lotto_sl_fees: { $sum: "$transaction_cost" },
                        lotto_three_winning_amount: { $sum: "$three_number_winner_total_amount" },
                        lotto_two_winning_amount: { $sum: "$two_number_winner_total_amount" },
                        lotto_winning_amount: { $sum: "$winner_amount" }
                    }
                }
            ])
                .exec()
                .then(l_results => {
                    if (l_results && l_results.length > 0) {
                        let l_result = l_results[0];
                        Object.keys(l_result).map(key => { result[key] = l_result[key] });
                    }
                    return PrizeResult.aggregate([
                        {
                            $match: draw_cond
                        },
                        {
                            $group: {
                                _id: "",
                                prize_club_resseler_sales: { $sum: "$agent_sales" },
                                prize_global_reseller_handling_fee: { $sum: "$global_reseller_cost" },
                                prize_global_reseller_sales: { $sum: "$global_agent_sales" },
                                prize_online_sales: { $sum: "$general_sales" },
                                prize_sales: { $sum: "$total_sales" },
                                prize_sl_fees: { $sum: "$transaction_cost" },
                                prize_ids: { $push: "$_id" }
                            }
                        }
                    ])
                })
                .then(p_results => {
                    if (p_results && p_results.length > 0) {
                        let p_result = p_results[0];
                        Object.keys(p_result).map(key => { result[key] = p_result[key] })
                        return Prize.aggregate([
                            {
                                $match: {
                                    _id: { $in: p_result.prize_ids }
                                }
                            },
                            {
                                $unwind: "$prize_description"
                            },
                            {
                                $group: {
                                    _id: '$prize_description.prize_description',
                                    prize_cost: { $sum: "$prize_description.prize_cost" }
                                }
                            },
                            {
                                $sort: {
                                    prize_cost: -1
                                }
                            }
                        ])
                    } else {
                        let prizes = [];
                        return Promise.resolve(prizes)
                    }
                })
                .then(costs => {
                    result.total_income = result.prize_sales + result.lotto_sales;
                    let number_of_prize = costs.length;
                    if (costs && Array.isArray(costs) && costs.length > 0) {
                        result.prize_costs = costs.map(cost => {
                            result.total_prize_cost += cost.prize_cost
                            return {
                                prize_name: cost._id + ' Cost',
                                prize_cost: cost.prize_cost,
                                prize_cost_pct: ((cost.prize_cost * 100) / result.total_income)
                            }
                        });
                    } else {
                        result.prize_costs = [{
                            prize_name: '1st Prize Cost',
                            prize_cost: 0,
                            prize_cost_pct: 0
                        }, {
                            prize_name: '2nd Prize Cost',
                            prize_cost: 0,
                            prize_cost_pct: 0
                        }, {
                            prize_name: '3rd Prize Cost',
                            prize_cost: 0,
                            prize_cost_pct: 0
                        }, {
                            prize_name: '4th Prize Cost',
                            prize_cost: 0,
                            prize_cost_pct: 0
                        }, {
                            prize_name: '5th Prize Cost',
                            prize_cost: 0,
                            prize_cost_pct: 0
                        }];
                    }

                    if (result.prize_costs.length < 5) {
                        let rst = 5 - result.prize_costs.length;
                        Array(rst).fill('#').map((arr, i) => {
                            let actIndx = (number_of_prize + i + 1);
                            if (actIndx == 2) {
                                result.prize_costs.push({
                                    prize_name: actIndx + 'nd Prize Cost',
                                    prize_cost: 0,
                                    prize_cost_pct: 0
                                })
                            } else if (actIndx == 3) {
                                result.prize_costs.push({
                                    prize_name: actIndx + 'rd Prize Cost',
                                    prize_cost: 0,
                                    prize_cost_pct: 0
                                })
                            } else {
                                result.prize_costs.push({
                                    prize_name: actIndx + 'th Prize Cost',
                                    prize_cost: 0,
                                    prize_cost_pct: 0
                                })
                            }
                        })

                    }

                    return Transaction.aggregate([
                        {
                            $match: {
                                description: "Signup Credit"
                            }
                        },
                        {
                            $project: {
                                club_id: "$club_id",
                                created_at: "$created_at",
                                credit_amount: "$credit_amount"
                            }
                        },
                        {
                            $match: date_cond
                        },
                        {
                            $group: {
                                _id: '',
                                total_signup_credit: {
                                    $sum: "$credit_amount"
                                }
                            }
                        }
                    ])
                })
                .then(signup_credits => {

                    if (signup_credits && Array.isArray(signup_credits) && signup_credits.length > 0) {
                        result.signup_credit = signup_credits[0].total_signup_credit;
                        result.signup_credit_pct = ((result.signup_credit * 100) / result.total_income);
                    }

                    date_cond.is_charge_applicable = true;
                    return SmsLog.aggregate([
                        {
                            $project: {
                                club_id: "$club_id",
                                created_at: "$created_at",
                                charge_amount: "$charge_amount",
                                sms_type: "$sms_type",
                                is_charge_applicable: "$is_charge_applicable"
                            }
                        },
                        {
                            $match: date_cond
                        },
                        {
                            $group: {
                                _id: '$sms_type',
                                sms_charge: { $sum: "$charge_amount" }
                            }
                        }
                    ])
                })
                .then(sms => {
                    if (sms && sms.length > 0) {
                        let lotto = sms.find(x => { return x._id == 'lotto' });
                        let prize = sms.find(x => { return x._id == 'prize' });
                        if (lotto) {
                            result.lotto_sms_fee = lotto.sms_charge;
                            result.lotto_sms_fee_pct = ((result.lotto_sms_fee * 100) / result.total_income);
                        }
                        if (prize) {
                            result.prize_sms_fee = prize.sms_charge;
                            result.prize_sms_fee_pct = ((result.prize_sms_fee * 100) / result.total_income);
                        }
                    }

                    result.lotto_sl_fees_pct = ((result.lotto_sl_fees * 100) / result.total_income);
                    result.prize_sl_fees_pct = ((result.prize_sl_fees * 100) / result.total_income);

                    result.lotto_online_sales_pct = ((result.lotto_online_sales * 100) / result.total_income);
                    result.lotto_club_resseler_sales_pct = ((result.lotto_club_resseler_sales * 100) / result.total_income);
                    result.lotto_global_reseller_sales_pct = ((result.lotto_global_reseller_sales * 100) / result.total_income);

                    result.prize_online_sales_pct = ((result.prize_online_sales * 100) / result.total_income);
                    result.prize_club_resseler_sales_pct = ((result.prize_club_resseler_sales * 100) / result.total_income);
                    result.prize_global_reseller_sales_pct = ((result.prize_global_reseller_sales * 100) / result.total_income);

                    result.lotto_sms_fee_pct = ((result.lotto_sms_fee * 100) / result.total_income);
                    result.prize_sms_fee_pct = ((result.prize_sms_fee * 100) / result.total_income);

                    result.lotto_three_winning_amount_pct = ((result.lotto_three_winning_amount * 100) / result.total_income);
                    result.lotto_two_winning_amount_pct = ((result.lotto_two_winning_amount * 100) / result.total_income);
                    result.lotto_lucky_dip_winning_amount_pct = ((result.lotto_lucky_dip_winning_amount * 100) / result.total_income);
                    result.lotto_incremented_amount_pct = ((result.lotto_incremented_amount * 100) / result.total_income);
                    result.lotto_reserve_amount_pct = ((result.lotto_reserve_amount * 100) / result.total_income);

                    result.signup_credit_pct = ((result.signup_credit * 100) / result.total_income);
                    result.net_income = result.lotto_sales + result.prize_sales;
                    result.cost_of_goods = result.lotto_incremented_amount + result.lotto_reserve_amount + result.lotto_three_winning_amount + result.lotto_two_winning_amount + result.lotto_lucky_dip_winning_amount + result.total_prize_cost;
                    result.cost_of_goods_pct = ((result.cost_of_goods * 100) / result.total_income);

                    result.gross_profit = (result.total_income - result.cost_of_goods);
                    result.gross_profit_pct = ((result.gross_profit * 100) / result.total_income);

                    result.total_expense = result.lotto_sl_fees + result.lotto_sms_fee + result.prize_sl_fees + result.prize_sms_fee + result.signup_credit;
                    result.total_expense_pct = ((result.total_expense * 100) / result.total_income);

                    result.net_profit = (result.gross_profit - result.total_expense);
                    result.net_profit_pct = ((result.net_profit * 100) / result.total_income);


                    resolve(result);
                })
                .catch(err => {
                    console.log(err)
                    reject(err)
                })
        })
    }


    router.route('/club/sales-report/download')
        .post(auth, (req, res) => {
            let query_string = '';
            Object.keys(req.body).map(key => {
                query_string = query_string.concat(`${key}=${req.body[key]}&`)
            })
            let page_url = `${process.env.APP_DOMAIN}/#/report-print/club/sales-report/${req.user.club_id}?${query_string}`;
            console.log(page_url);
            GlobalMethods.printPDF(page_url, 1000)
                .then(pdf => {
                    res.set({ 'Content-Type': 'application/pdf', 'Content-Length': pdf.length })
                    res.send(pdf)
                })
                .catch(err => {
                    res.status(500).send("Something went wrong please try again.")
                })
        })

    router.route('/club/sales/entered-player-list')
        .post(auth, (req, res) => {
            let cond = new Object();
            let query;
            if (req.body.jackpot_id) {
                cond = {
                    lottery_type: 'lotto',
                    jackpot_id: mongoose.Types.ObjectId(req.body.jackpot_id)
                }
                query = Sales.aggregate([
                    {
                        $match: cond
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
                            ticket_buy_date: "$created_at",
                            ticket_cost: "$sales_info.net_amount",
                            tickets: { $size: "$tickets" },
                            supporter_name: { $concat: ["$supporter.first_name", " ", "$supporter.last_name"] },
                            supporter_email: "$supporter.email",
                            supporter_phone: "$supporter.phone",
                            no_of_draw_purchased: "$total_number_of_game",
                            no_of_remaining_draws: { $subtract: ["$number_of_game_remaining", 1] },
                            player_type: "$player_type"
                        }
                    }
                ])
            } else {
                cond = {
                    lottery_type: { $in: ['raffle', 'fifty_fifty'] },
                    prize_id: mongoose.Types.ObjectId(req.body.prize_id)
                }
                query = Sales.aggregate([
                    {
                        $match: cond
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
                        $unwind: "$tickets"
                    },
                    {
                        $lookup: {
                            from: 'prizes',
                            localField: 'prize_id',
                            foreignField: '_id',
                            as: 'prize'
                        }
                    },
                    {
                        $unwind: "$prize"
                    },
                    {
                        $project: {
                            ticket_buy_date: "$created_at",
                            ticket_cost: "$sales_info.net_amount",
                            ticket: "$tickets",
                            supporter_name: { $concat: ["$supporter.first_name", " ", "$supporter.last_name"] },
                            supporter_email: "$supporter.email",
                            supporter_phone: "$supporter.phone",
                            no_of_draw_purchased: "$total_number_of_game",
                            number_of_game_remaining: { $subtract: ["$number_of_game_remaining", 1] },
                            prize_type: "$prize.prize_type",
                            game_for_admin: "$game_for_admin",
                            admin_club_name: "$admin_club_name",
                            admin_club_county: "$admin_club_county",
                            player_type: "$player_type"
                        }
                    }
                ])
            }
            query
                .exec()
                .then(data => {
                    res.json({ success: true, data: data })
                })
                .catch(err => {
                    res.json({ success: false, message: "Internal server error.", err: err });
                })
        })

    router.route('/club/lotto-report/download')
        .get((req, res) => {
            let query_string = '';
            Object.keys(req.query).map(key => {
                query_string = query_string.concat(`${key}=${req.query[key]}&`)
            })
            let page_url = `${process.env.REPORT_APP_DOMAIN}/club/lotto-report/${req.query.club_id}?${query_string}`;
            console.log("Lotto Report", page_url);
            GlobalMethods.printPDF(page_url, 1000)
                .then(pdf => {
                    res.set({ 'Content-Type': 'application/pdf', 'Content-Length': pdf.length })
                    res.send(pdf)
                })
                .catch(err => {
                    res.status(500).send("Something went wrong please try again.")
                })
        })

    router.route('/club/download/excel-file')
        .get(auth, async (req, res) => {
            try {
                const rootDir = process.env.SERVER_RESOURCE_PATH;
                let filePath = rootDir + 'template/lotto_ticket_template.xlsx';               
                let ticketTemplate = fs.readFileSync(filePath);
                res.set({ 'Content-Type': 'application/octet-stream', 'Content-Length': ticketTemplate.length })
                res.send(ticketTemplate);
            } catch (error) {
                res.json({ success: false, message: "Internal server error occured." });
            }
        })

    router.route('/club/upload/lotto-tickets')
        .put(auth, async (req, res) => {
            try {
                console.log(req.body);
                let supporters = [];
                let crntJackpot = await Jackpot.findOne({
                    club_id: req.user.club_id,
                    is_alive: true
                })
                    .populate({ path: 'club_id' });

                if (crntJackpot && crntJackpot._id, crntJackpot.club_id) {
                    supporters = await confirmSupporters(req.body, crntJackpot.club_id);
                    if (supporters.length) {
                        let company = await Company.findOne({});
                        let tickets = await generateTicket(supporters, crntJackpot, 'lotto', crntJackpot.club_id, company.pricing.lotto_uploaded_transaction_fee);
                        sendPurchaseNotifications(tickets, 'lotto');
                        res.json({ success: true, message: `${tickets.length} Data uploaded.`, data: tickets });
                    } else
                        res.json({ success: false, message: "No valid data found" });
                } else {
                    res.json({ success: false, message: "No active lotto found." });
                }
            } catch (error) {
                console.log(error);
                res.json({ success: false, message: "Internal server error occured." });
            }
        })

    router.route('/club/upload/prize-tickets')
        .put(auth, async (req, res) => {
            try {
                let supporters = [];
                let crntPrize = await Prize.findOne({
                    _id: req.query.id
                })
                    .populate({ path: 'club_id' });

                if (crntPrize && crntPrize._id, crntPrize.club_id) {
                    supporters = await confirmSupporters(req.body, crntPrize.club_id);
                    if (supporters.length) {
                        let company = await Company.findOne({});
                        let tickets = await generateTicket(
                            supporters,
                            crntPrize,
                            crntPrize.prize_type,
                            crntPrize.club_id,
                            company.pricing.lotto_uploaded_transaction_fee
                        );
                        sendPurchaseNotifications(tickets, 'prize');
                        res.json({ success: true, message: `${tickets.length} Data uploaded.`, data: tickets });
                    } else
                        res.json({ success: false, message: "No valid data found" });
                } else {
                    res.json({ success: false, message: "No active lotto found." });
                }
            } catch (error) {
                console.log(error);
                res.json({ success: false, message: "Internal server error occured." });
            }
        })

    async function confirmSupporters(items, club) {
        let sales_items = [];
        for (const item of items) {
            let cond = {};
            if (item.email && item.email.length > 3 && item.phone_number && item.phone_number.length > 3) {
                cond = {
                    $or: [
                        { email: item.email.toLowerCase() },
                        { phone: item.phone_number }
                    ]
                }
            } else if (item.email && item.email.length > 3) {
                cond = { email: item.email.toLowerCase() }
            } else if (item.phone_number && item.phone_number.length > 3) {
                cond = { phone: item.phone_number }
            }
            if (Object.keys(cond).length) {
                let supporter;
                supporter = await Supporter.findOne(cond)
                if (!supporter) {
                    supporter = await Supporter.create({
                        is_active: true,
                        auto_created: true,
                        has_registration_done: false,
                        active_clubs: [{
                            club_id: club._id,
                            status: "Active",
                            activated_date: new Date(),
                            sms_draw_notification: true,
                            email_draw_notification: true,
                            sms_result_notification: true,
                            email_result_notification: true,
                            sms_winner_notification: true,
                            email_winner_notification: true,
                        }],
                        payment_cards: [],
                        varification: {
                            is_verified: true
                        },
                        password_info: {
                            is_created: false
                        },
                        favourite_club: club._id,
                        created_at: new Date(),
                        first_name: item.first_name,
                        last_name: item.last_name,
                        address1: item.address1,
                        address2: item.address2,
                        town: item.town,
                        postcode: item.postcode,
                        phone_code: item.dial_code,
                        phone: item.phone_number,
                        notification_by: 'enabled',
                        country: item.country,
                        email: (item.email && item.email.length) ? item.email.toLowerCase() : undefined,
                        county: item.county
                    })
                } else {
                    let club_status = supporter.active_clubs.find(ac => ac.club_id.toString() == club._id.toString())
                    if (club_status) {
                        if (club_status.status != 'Active') {
                            Supporter.update({
                                _id: supporter._id,
                                'active_clubs.club_id': club._id
                            }, {
                                $set: {
                                    'active_clubs.$.sms_draw_notification': true,
                                    'active_clubs.$.email_draw_notification': true,
                                    'active_clubs.$.sms_result_notification': true,
                                    'active_clubs.$.email_result_notification': true,
                                    'active_clubs.$.sms_winner_notification': true,
                                    'active_clubs.$.email_winner_notification': true,
                                    'active_clubs.$.status': 'Active',
                                    'active_clubs.$.activated_date': new Date()
                                }
                            })
                        }
                    } else {
                        await Supporter.update({
                            _id: supporter._id,
                        }, {
                            $push: {
                                active_clubs: {
                                    club_id: club._id,
                                    status: 'Active',
                                    is_from_game: false,
                                    sms_draw_notification: true,
                                    email_draw_notification: true,
                                    sms_result_notification: true,
                                    email_result_notification: true,
                                    sms_winner_notification: true,
                                    email_winner_notification: true,
                                    activated_date: new Date()
                                }
                            }
                        })
                    }
                }
                item.supporter_id = supporter._id;
                item.supporter_name = (supporter.first_name + ' ' + supporter.last_name);
                sales_items.push(item)
            }
        }
        return sales_items;
    }

    async function generateTicket(items, game, game_type, club, transaction_rate,) {
        let generatedTickets = [];
        for (const item of items) {
            let ticketNo = await getNextSequence('tikcet_no');
            let tickets = [];
            if (game_type == 'lotto') {
                tickets = item.tickets;
            } else {
                tickets = await getTickets(item.number_of_tickets);
            }

            let net_amount = parseFloat(game.per_line_price * tickets.length);
            let ltto_fee = parseFloat((net_amount * (transaction_rate / 100)).toFixed(2)), waived_amount = 0;
            if (club && club._id && club.defer_all_fees_except_sms && club.waive_others_fees_from && club.waive_others_fees_to) {
                if (smartMoments.isDateWithinRange(club.waive_others_fees_from, club.waive_others_fees_to)) {
                    ltto_fee = 0;
                    waived_amount = parseFloat(((net_amount * transaction_rate) / 100).toFixed(2));
                }
            }
            if (club && club._id && club.waive_all_fees_incld_sms && club.waive_all_fees_from && club.waive_all_fees_to) {
                if (smartMoments.isDateWithinRange(club.waive_all_fees_from, club.waive_all_fees_to)) {
                    ltto_fee = 0;
                    waived_amount = parseFloat(((net_amount * transaction_rate) / 100).toFixed(2));
                }
            }

            let salesObj = {
                lottery_type: game_type,
                purchase_type: "custom_week",
                total_number_of_game: item.number_of_draws,
                number_of_game_remaining: item.number_of_draws,
                is_agent_sales: false,
                sales_type: "supporter",
                tickets: tickets,
                player_type: 'Uploaded',
                sales_info: {
                    sold_at: new Date(),
                    total_ticket: tickets.length,
                    total_price: item.total_price,
                    discount_amount: 0,
                    net_amount: item.total_price,
                    smartlotto_fee: ltto_fee,
                    waived_amount: waived_amount,
                    global_agent_fee: 0
                },
                created_at: new Date(),
                club_id: club._id,
                club_name: club.org_name,
                supported_team: item.supporting_team && item.supporting_team.length ? item.supporting_team : club.org_name,
                ticket_no: ticketNo,
                supporter_id: item.supporter_id,
                supporter_name: `${item.first_name} ${item.last_name}`
            }
            if (game_type == 'lotto') {
                salesObj.jackpot_id = game._id;
            } else {
                salesObj.prize_id = game._id;
            }
            let sales = await Sales.create(salesObj)
            let hasBalance = await Balance.findOne({ club_id: club._id, supporter_id: item.supporter_id })
            if (!hasBalance) {
                let balance = await Balance.create({
                    "balance": 0,
                    "purchase": 0,
                    "automatic_top_up": {
                        "is_active": false,
                    },
                    "is_transaction_in_process": false,
                    "created_at": new Date(),
                    "club_id": club._id,
                    "supporter_id": item.supporter_id,
                    "supporter_type": "supporter",
                    "last_updated_at": new Date()
                })
            }
            generatedTickets.push(ticketNo);
        }
        return generatedTickets;
    }

    function getTickets(number_of_ticket) {
        let tickets = new Array(number_of_ticket).fill('#').map(hsh => {
            return new Promise((resolve, reject) => {
                GlobalMethods.getNextSequence("prize_ticket")
                    .then(seq => {
                        resolve(seq.toString());
                    })
                    .catch(err => {
                        reject(err);
                    })
            })
        })
        return Promise.all(tickets);
    }

    // async function sendPurchaseNotifications(ticket_ids, type) {
    //     let template = null;
    //     if (type == 'lotto') {
    //         template = await MessageTemplate.findOne({
    //             trigger: 'lotto_ticket_purchased',
    //             message_type: 'email',
    //             is_active: true
    //         });
    //         let sales = await Sales.find({ ticket_no: { $in: ticket_ids } }).populate({ path: 'club_id' }).populate({ path: 'supporter_id' }).populate({ path: 'jackpot_id', select: 'next_draw_date' });
    //         let infoList = sales.map(info => {
    //             let obj = {
    //                 send_players: info.supporter_id,
    //                 sel: info,
    //                 club: info.club_id
    //             }
    //             return obj;
    //         })
    //         TemplatesShared.mailForLottoTicketPurchased(infoList, 'lotto_ticket_purchased');

    //     } else {
    //         template = await MessageTemplate.findOne({
    //             trigger: 'prize_ticket_purchased',
    //             message_type: 'email',
    //             is_active: true
    //         });
    //         if (template && template._id) {
    //             let sales = await Sales.find({ ticket_no: { $in: ticket_ids } }).populate({ path: 'club_id' }).populate({ path: 'supporter_id' });
    //             if (sales.length > 0) {
    //                 let resultTexts = create_ticket_purchase_text(sales, template);
    //                 let users_addresses = resultTexts.map(detail => {
    //                     if (detail.email) {
    //                         return {
    //                             email: detail.email, email_text: detail.email_text, email_head: detail.email_head
    //                         };
    //                     }
    //                 })
    //                 let addresses = users_addresses.filter(function (element) {
    //                     return element !== undefined;
    //                 });
    //                 let club_info = sales[0].club_id;
    //                 let club_id = club_info._id;
    //                 return GlobalMethods.mailForClubStandardTemplate(addresses, club_info)
    //                     .then(sends => {
    //                         let is_sent = true;
    //                         let status_send = 'email send';
    //                         let context = addresses.map(add => {
    //                             return {
    //                                 address: add.email, text: add.email_text
    //                             };
    //                         })
    //                         let other_values = {
    //                             supporter_ids: [],
    //                             notification_id: template._id,
    //                             user_type: 'supporter',
    //                             trigger_type: 'lotto_ticket_purchased',
    //                             club_id: club_id
    //                         }
    //                         GlobalMethods.createNotificationLog(context, sends, other_values)
    //                     }).catch(err => {
    //                         console.log("err", err);
    //                     })
    //             }
    //         }
    //     }
    // }

    async function sendPurchaseNotifications(ticket_ids, type) {
        if (type == 'lotto') {
            let sales = await Sales.find({ ticket_no: { $in: ticket_ids } }).populate({ path: 'club_id' }).populate({ path: 'supporter_id' }).populate({ path: 'jackpot_id', select: 'next_draw_date' });
            let infoList = sales.map(info => {
                let obj = {
                    send_players: info.supporter_id,
                    sel: info,
                    club: info.club_id
                }
                return obj;
            })
            TemplatesShared.mailForLottoTicketPurchased(infoList, 'lotto_ticket_purchased');

        } else {
            let sales = await Sales.find({ ticket_no: { $in: ticket_ids } }).populate({ path: 'club_id' }).populate({ path: 'supporter_id' }).populate({ path: 'prize_id', select: 'draw_date prize_type promo_image' });
            if (sales.length > 0) {
                let infoList = sales.map(info => {
                    let obj = {
                        send_players: info.supporter_id,
                        sel: info,
                        club: info.club_id
                    }
                    return obj;
                })
                TemplatesShared.mailForPrizeTicketPurchased(infoList, 'prize_ticket_purchased');
            }
        }
    }

    function create_ticket_purchase_text(infoList, template) {
        let texts = infoList.map(info => {
            let player = info.supporter_id;
            let sale = info;
            let club = info.club_id;
            let ticket_id = sale._id;
            let email_head = '';
            let email_text = '';
            let email = player.email;
            let organisation_name = "";
            organisation_name = club.org_name;
            let club_id = club._id;
            //  let play_link = `${process.env.GAME_APP_DOMAIN}/#/pages/club/${club_id}`;
            let play_link = `${process.env.GAME_APP_DOMAIN}/#/pages/lotto/play?c_id=${club_id}`;
            let search_club_link = `${process.env.APP_DOMAIN}/#/pages/search`;
            let ticket_link = `${process.env.GAME_APP_DOMAIN}/#/pages/ticket/lotto-ticket-view?tid=${ticket_id}`;
            //let play_lotto_link = `${process.env.GAME_APP_DOMAIN}/#/pages/club/${club_id}`;
            let play_lotto_link = `${process.env.GAME_APP_DOMAIN}/#/pages/lotto/play?c_id=${club_id}`;
            // if (club && club.club_url) {
            //     let club_url = club.club_url;
            //     let server_link = `https://smartlotto.ie`;
            //     if (process.env.NODE_ENV == 'test')
            //         server_link = `https://esmartlotto.ie`
            //     play_lotto_link = `${server_link}/${club_url}/lotto`;
            //     play_link = play_lotto_link;
            // }
            let add_fund_link = `${process.env.GAME_APP_DOMAIN}/#/pages/payment/balance?c_id=${club_id}`;
            let helpdesk_link = `${process.env.GAME_APP_DOMAIN}/#/pages/help-desk/add`;
            email_head = stringTemplateParser(template.subject,//body.email_content,
                {
                    first_name: player.first_name,
                    last_name: player.last_name,
                    email: player.email,
                    mobile: player.phone,
                    organisation_name: organisation_name,
                    our_club: organisation_name,
                    play_link: play_link,
                    play_lotto: play_lotto_link,
                    ticket_link: ticket_link,
                    add_fund_link: add_fund_link,
                    helpdesk_link: helpdesk_link,
                    search_club_link: search_club_link

                })

            email_text = stringTemplateParser(template.template_text,//body.email_content,
                {
                    first_name: player.first_name,
                    last_name: player.last_name,
                    email: player.email,
                    mobile: player.phone,
                    organisation_name: organisation_name,
                    ticket_id: ticket_id,
                    play_link: play_link,
                    our_club: organisation_name,
                    play_lotto: play_lotto_link,
                    ticket_link: ticket_link,
                    add_fund_link: add_fund_link,
                    helpdesk_link: helpdesk_link,
                    search_club_link: search_club_link

                })
            email_text = email_text.replace(/(?:\r\n|\r|\n)/g, '<br>');
            email_head = email_head.replace(/(?:\r\n|\r|\n)/g, '<br>');
            let result = { email: email, email_head: email_head, email_text: email_text }
            //  console.log("find result", result);
            return result;
        })

        return texts;
    }

})
