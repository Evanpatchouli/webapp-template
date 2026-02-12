import cache from '@/cache';
import { OPTWay } from '@/constants/opt.constant';
import { IllegalArgument } from '@/exception/CustomError';
import { TimeUnitString, ValuesOf } from '@/types';
import { Injectable, Session } from '@nestjs/common';
import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

const transporter = nodemailer.createTransport({
  host: 'http://smtp.qq.com/', // SMTP服务器地址
  port: 465, // SMTP端口
  secure: true, // 使用SSL/TLS
  auth: {
    user: 'evanpatchouli@foxmail.com', // 邮箱账号
    pass: 'rlzgoyjkqydcdfhg', // SMTP授权码
  },
});

const EmailSubjectMap = {
  [OPTWay.EMAIL_LOGIN]: 'Webapp 登录验证邮件',
};

@Injectable()
export default class EmailService {
  constructor() {}

  async sendEmail(to: string, options: Omit<Mail.Options, 'from' | 'to'>) {
    await transporter.sendMail({
      from: '"Evanpatchouli" <evanpatchouli@foxmail.com>', // 发送者
      to, // 接收者
      ...options,
    });
  }

  async sendOptEmail(
    to: string,
    opt: string,
    optType: ValuesOf<typeof OPTWay>,
  ) {
    if (!to) throw new IllegalArgument('接收者邮箱地址不能为空');
    await this.sendEmail(to, {
      subject: EmailSubjectMap[optType],
      text: `您正在通过邮箱登录 Webapp，您的${optType}验证码为：${opt}，30分钟内有效，请勿将验证码告知他人，如不是本人请忽略本邮件。`,
    });
  }
}
