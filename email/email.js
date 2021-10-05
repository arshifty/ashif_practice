/*

  async function sendPlayerEmail(req, data, club, activateStatus) {

        let Club_Notification_Settings = `https://games.esmartlotto.ie/#/pages/profile/notification-setting/${req.user.club_id}`;
        let landing_page = process.env.NODE_ENV == "production" ? `https://smartlotto.ie/${club.club_url}` : `https://esmartlotto.ie/${club.club_url}`;
        let message = "";
        let email_heading = "";
        if (activateStatus == 'deactivate') {
            email_heading = "Account Deactivated";
            message = `
            Hi  ${data.first_name},
            <br><br>
            Your ${club.org_name} account has been deactivated and will no longer receive emails or SMS relating to draws and results via the Smart Lotto system.
            <br><br>
            To reactivate your account please contact customercare@smartlotto.ie or play here at ${landing_page}. <br>
            Please note, if you choose to play with ${club.org_name}, upon reactivation your notifications will still be turned off, to update this please follow this link: ${Club_Notification_Settings}
            <br><br>
            If you did not request a deactivation please contact customercare@smartlotto.ie.
            ` ;
        } else {
            email_heading = "Account Reactivated";
            message = `
            Hi ${data.first_name},
            <br><br>
            Your ${club.org_name} account has been reactivated. With this, your notifications have also been re-enabled.<br>
            To update your notification preferences please follow this link: ${Club_Notification_Settings}.
            <br><br>
            To deactivate your account please contact customercare@smartlotto.ie.<br>
            Please note, if you choose to deactivate your account with ${club.org_name}, upon deactivation your notifications will be turned off.
            <br><br>
            If you did not request a reactivation please contact customercare@smartlotto.ie.
            ` ;
        }

        let user = {
            email: data.email,
            email_head: email_heading,
            email_text: message
        };

        let users = [user];
        let mail = await GlobalMethods.mailForClubStandardTemplate(users, club);

        if (mail) {
    
        }
    }



*/


/*
  mailForClubStandardTemplate: function (users, club_info) {
    // console.log("mailForClubStandardTemplate");
    let from_title = '"Smartlotto Lotto Draw"'

    //  if (type == 'club') {
    if (club_info && club_info.org_name) {
      from_title = `${club_info.org_name}`;
      // }
    }

    let play_link = `${process.env.GAME_APP_DOMAIN}/#/pages/club/${club_info.club_id}`;
    let add_fund_link = `${process.env.GAME_APP_DOMAIN}/#/pages/payment/balance?c_id=${club_info.club_id}`;
    let helpdesk_link = `${process.env.GAME_APP_DOMAIN}/#/pages/help-desk/add`;
    let send_emails = [];
    let profile_link = `${process.env.GAME_APP_DOMAIN}/#/pages/profile/my-profile`;
    const nodemailer = require('nodemailer');
    let transporter = nodemailer.createTransport({
      host: 'mail.blacknight.com',
      port: 587,
      secure: false,
      auth: {
        user: 'noreplynotifications@esmartlotto.ie',
        pass: 'FCxsHP2C4HSIS45hgdt375'//  FCxsHP2C4HSIS45hgdt375
      }
    });
    let responses = users.map(user => {
      let email = user.email;
      //  console.log("email", email);
      let subject = user.email_head;
      let alter_text = `<table class="table_full editable-bg-color bg_color_e6e6e6 editable-bg-image" bgcolor="#e6e6e6" width="100%" align="center"  mc:repeatable="castellab" mc:variant="Header" cellspacing="0" cellpadding="0" border="0" style="font-family: 'Montserrat', sans-serif;">
        <tbody>
          <tr>
            <td>
              
              <table class="table1 editable-bg-color bg_color_5cb85c" bgcolor="#fff" width="700" align="center" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto; font-family: 'Montserrat', sans-serif;"> 
                <tbody>
                  <tr>
                    <td style="text-align: center; padding-top: 50px;">
                      <div style="width: 78px; height: 78px; border-radius: 50%; background: rgba(255, 255, 255, 0.15); border: 1px dashed #2993C8; padding: 10px; text-align: center; margin: 0 auto;">
                        <div style="background: #fff; height: 100%; width: 100%; border-radius: 50%; display: flex;
                        align-items: center; justify-content: center; overflow: hidden;"><img src="${process.env.APP_DOMAIN}${club_info.logo}" alt="" style="max-width:100%; border-radius: 50%;"></div>
                      </div>
                      <h2 style="font-weight: 800; font-size:25px; letter-spacing: 0.02em; color: #263843; margin: 10px 0 15px;">${club_info.org_name} <br></h2>
                    </td>
                  </tr>   
                  <tr>  
                    <td style="padding: 20px 40px; color: #000; font-family: 'Montserrat', sans-serif; font-size: 18px; line-height: 30px; padding-top: 0;">
                      <p> 
                        <br>  <br>  
                        ${user.email_text}
                      </p> 
                    </td>
                  </tr>   
                  <tr>
                    <td style="padding: 20px 40px; text-align: center; padding-top: 20px;">
                      <p style="font-weight: 300; font-size: 12px; line-height: 21px;">If you need any assistance, feel free to contact us or our Smart Lotto Support Team by contacting their helpdesk ${helpdesk_link} or by phone/email from 8.00am – 5.30pm Monday – Friday. </p> 
                    </td>
                  </tr>
                  <tr>
                    <td style="background: #F9F9F9; padding: 20px; text-align: center;">
                      <div style="display: flex; justify-content: center; margin: 0 auto 20px; max-width: 250px;">
                        <div style="width: 50px; height: 50px; border-radius: 50%; background: rgba(255, 255, 255, 0.15); border: 1px dashed #2993C8; padding: 5px; text-align: center;">
                          <div style="background: #fff; height: 100%; width: 100%; border-radius: 50%; display: flex;
                          align-items: center; justify-content: center; overflow: hidden;"><img src="${process.env.APP_DOMAIN}${club_info.logo}" alt="" style="max-width:100%; border-radius: 50%;"></div>
                        </div>
                        <h2 style="display: block; font-weight: 900; line-height: 1; margin: 0; font-size: 21px; letter-spacing: 0.02em; color: #2993C8; padding-left: 15px; margin-top: 18px;">${club_info.org_name}</h2>
                      </div>
                      <p style="font-weight: 300; font-size: 13px; line-height: 21px; color: #5E6C74; margin: 0;">Copyright © 2020 Smart Lotto & ${club_info.org_name}, All rights reserved.</p>
                      <p style="font-weight: 300; font-size: 12px; line-height: 19px; color: #858585; margin: 0;">Want to change how you receive these emails? <br>	You can <a href="${profile_link}" style="color: #858585; ">update your preferences</a> or <a href="${profile_link}" style="color: #858585; ">unsubscribe from this list.</a></p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>`

      let value = {
        text: alter_text,
        email: email,
        subject: subject,
        header: from_title
      }
      send_emails.push(value);
    })
    return new Promise((resolve, reject) => {
      if (send_emails.length < 10) {
        sendAllEmails(from_title, send_emails)
          .then(result => {
            resolve({ status: true, message: "email send", result: result })
          })
      }
      else {
        queuedAllEmails(from_title, send_emails)
          .then(result => {
            resolve({ status: true, message: "email send", result: result })
          })
      }
    })
  },


  */

  /*

  function sendAllEmails(header, send_emails) {
  return new Promise((resolve, reject) => {
    var req_body = JSON.stringify(send_emails);
    //  console.log("header", header, send_emails.length);
    //  var new_header = 'DaphneGlover';
    // var req_body = JSON.stringify([{
    //   "text": "<h2>Client error occured.</h2>",
    //   "email": "ahsancse.brac@gmail.com",
    //   "subject": "Add card error occured in smartlotto."
    // }]);
    var req_url = `${process.env.PRNG_EMAIL_SMS_URI}/api/v1/send-bulk-email`;
    request({
      headers: {
        'Content-Type': 'application/json'
      },
      uri: req_url,
      body: req_body,
      method: 'POST'
    }, function (error, rest, body) {
      if (error) {
        reject({ status: false, message: error })
      }
      else {
        resolve({ status: true, message: "Email sent" })
      }
    })
  })
}

*/

/*


function queuedAllEmails(header, send_emails) {
  let all_sends = send_emails.map(send_email => {
    return new Promise((resolve, reject) => {
      let obj = {
        header: send_email.header,
        text: send_email.text,
        email: send_email.email,
        subject: send_email.subject
      }
      EmailQueue.create({
        email_information: obj
      })
        .then(emailqueue => {
          resolve({ status: true })
        })
    })
  })
  return Promise.all(all_sends);
}

*/