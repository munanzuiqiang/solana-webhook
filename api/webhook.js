const express = require('express');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json());

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  console.log('收到 Webhook 数据:', JSON.stringify(req.body, null, 2));

  req.body.forEach(event => {
    if (event.type === 'TRANSFER') {
      const transferInfo = {
        signature: event.signature,
        source: event.source,
        destination: event.destination,
        amount: event.amount / 1e9,
        timestamp: new Date(event.timestamp * 1000).toLocaleString(),
      };

      console.log('检测到代币转账:', transferInfo);

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.NOTIFY_EMAIL,
        subject: `Solana 钱包代币转账通知 - ${transferInfo.signature}`,
        text: `
          检测到新的代币转账！
          交易签名: ${transferInfo.signature}
          来源地址: ${transferInfo.source}
          目标地址: ${transferInfo.destination}
          数量: ${transferInfo.amount} SOL
          时间: ${transferInfo.timestamp}
        `,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('邮件发送失败:', error);
        } else {
          console.log('邮件发送成功:', info.response);
        }
      });
    }
  });

  res.status(200).send('Webhook 接收成功');
};