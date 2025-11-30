
import { Injectable } from '@nestjs/common';
import { CommonHttpService } from 'src/common/common.service';
import { EnrollUserDto } from './dtos/enroll-user.dto';
import { AddMemberDto } from './dtos/add-member.dto';
import { ListCoursesQueryDto } from './dtos/list-courses-query.dto';

@Injectable()
export class ZohoService {
  private readonly region = process.env.ZOHO_REGION || 'com';
  private readonly accountsBase = `https://accounts.zoho.${this.region}`;
  private readonly learnBase = `https://learn.zoho.${this.region}/learn/api/v1`;
  private readonly portal = process.env.ZOHO_LEARN_PORTAL!;
  private readonly clientId = process.env.ZOHO_CLIENT_ID!;
  private readonly clientSecret = process.env.ZOHO_CLIENT_SECRET!;
  private readonly refreshToken = process.env.ZOHO_REFRESH_TOKEN!;

  constructor(private httpService: CommonHttpService) {}

  private async getAccessToken(): Promise<string> {
    const url = `${this.accountsBase}/oauth/v2/token`;
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: this.refreshToken,
    });

    const { data } = await this.httpService.post(url, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    return data.access_token;
  }

  /** -------- Existing methods -------- */

  async listCourses(queryParams: ListCoursesQueryDto) {
    const token = await this.getAccessToken();

    const { data } = await this.httpService.get(
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

    const { data } = await this.httpService.post(
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

    const { data } = await this.httpService.post(
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

  /** -------- New: enrollment & membership helpers -------- */

  async getEnrollmentRequests(courseId: string) {
    const token = await this.getAccessToken();

    const { data } = await this.httpService.get(
      `${this.learnBase}/portal/${encodeURIComponent(this.portal)}/course/${courseId}/requests`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
        },
      },
    );

    return data;
  }

  async getCourseMembers(courseId: string) {
    const token = await this.getAccessToken();

    const { data } = await this.httpService.get(
      `${this.learnBase}/portal/${encodeURIComponent(this.portal)}/course/${courseId}/member`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
        },
      },
    );

    return data;
  }

  async getCourseDataByUrl(courseUrl: string) {
    const token = await this.getAccessToken();

    const { data } = await this.httpService.get(
      `${this.learnBase}/portal/${encodeURIComponent(this.portal)}/course`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
        },
        params: {
          'course.url': courseUrl,
        },
      },
    );

    return data;
  }

  async getCourseResources(courseId: string) {
    const token = await this.getAccessToken();

    const { data } = await this.httpService.get(
      `${this.learnBase}/portal/${encodeURIComponent(this.portal)}/course/${courseId}/file`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
        },
      },
    );

    return data;
  }

  async completeCourse(courseId: string) {
    const token = await this.getAccessToken();

    const { data } = await this.httpService.post(
      `${this.learnBase}/portal/${encodeURIComponent(this.portal)}/course/${courseId}/complete`,
      {},
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
        },
      },
    );

    return data;
  }

  async inviteUserToCustomPortal(
    email: string,
    firstName?: string,
    lastName?: string,
  ) {
    const token = await this.getAccessToken();

    const { data } = await this.httpService.post(
      `${this.learnBase}/portal/${encodeURIComponent(this.portal)}/invite`,
      {
        userlist: [
          {
            emailId: email,
            fname: firstName,
            lname: lastName,
          },
        ],
        mailContent: '',
        customPortalId: process.env.ZOHO_CUSTOM_PORTAL_ID,
      },
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
        },
      },
    );

    return data;
  }
}
