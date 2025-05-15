const express = require('express');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

const app = express();

// 解析 JSON 数据
app.use(express.json());

// 配置邮件服务（Gmail）
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // 你的 Gmail 地址
    pass: process.env.EMAIL_PASS, // 你的 App Password
  },
});

// Webhook 接收端点
app.post('/webhook', (req, res) => {
  console.log('收到 Webhook 数据:', JSON.stringify(req.body, null, 2));

  // 检查转账事件
  req.body.forEach(event => {
    if (event.type === 'TRANSFER') {
      const transferInfo = {
        signature: event.signature,
        source: event.source,
        destination: event.destination,
        amount: event.amount / 1e9, // 转换为 SOL
        timestamp: new Date(event.timestamp * 1000).toLocaleString(),
      };

      console.log('检测到代币转账:', transferInfo);

      // 配置邮件
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.NOTIFY_EMAIL, // 接收通知的邮箱
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

      // 发送邮件
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('邮件发送失败:', error);
        } else {
          console.log('邮件发送成功:', info.response);
        }
      });
    }
  });

  // 响应 Helius
  res.status(200).send('Webhook 接收成功');
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});