import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { AddMemberDto } from './dtos/add-member.dto';
import { ListCoursesQueryDto } from './dtos/list-course-query.dto';
import { EnrollUserDto } from './dtos/enroll-user.dto';
// import {
//   ListCoursesQueryDto,
//   EnrollUserDto,
//   AddMemberDto,
// } from './dto/zoho-learn.dto';

@Injectable()
export class ZohoService {
  private readonly region = process.env.ZOHO_REGION || 'com';
  private readonly accountsBase = `https://accounts.zoho.${this.region}`;
  private readonly learnBase = `https://learn.zoho.${this.region}/learn/api/v1`;
  private readonly portal = process.env.ZOHO_LEARN_PORTAL!;
  private readonly clientId = process.env.ZOHO_CLIENT_ID!;
  private readonly clientSecret = process.env.ZOHO_CLIENT_SECRET!;
  private readonly refreshToken = process.env.ZOHO_REFRESH_TOKEN!;

  private async getAccessToken(): Promise<string> {
    const url = `${this.accountsBase}/oauth/v2/token`;
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: this.refreshToken,
    });

    const { data } = await axios.post(url, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    return data.access_token;
  }

  async listCourses(queryParams: ListCoursesQueryDto) {
    const token = await this.getAccessToken();

    const { data } = await axios.get(
      `${this.learnBase}/portal/${encodeURIComponent(this.portal)}/course`,
      {
        headers: { Authorization: `Zoho-oauthtoken ${token}` },
        params: queryParams,
      },
    );

    return data;
  }

  async enrollUser(enrollDto: EnrollUserDto) {
    const token = await this.getAccessToken();

    const { data } = await axios.post(
      `${this.learnBase}/portal/${encodeURIComponent(this.portal)}/course/${enrollDto.courseId}/enroll`,
      { user_id: enrollDto.userId },
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
        },
      },
    );

    return data;
  }

  async addMember(addMemberDto: AddMemberDto) {
    const token = await this.getAccessToken();

    const { data } = await axios.post(
      `${this.learnBase}/portal/${encodeURIComponent(this.portal)}/course/${addMemberDto.courseId}/member`,
      { user_id: addMemberDto.userId },
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
        },
      },
    );

    return data;
  }
}
