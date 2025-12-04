import { Injectable } from '@nestjs/common';
import { CommonHttpService } from 'src/common/common.service';
// import { ListCoursesQueryDto } from '../zoho/dtos/list-courses-query.dto';
require('dotenv').config();

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
      grant_type: 'refresh_token', // Use refresh_token flow
      client_id: this.clientId, // Your Zoho client ID
      client_secret: this.clientSecret, // Your Zoho client secret
      refresh_token: this.refreshToken, // Your Zoho refresh token
    });

    console.log(body.toString());

    const res = await this.httpService.post(url, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    // console.log(res);

    return res;
  }

  /** -------- Fetch Courses -------- */
  async listCourses(queryParams: any) {
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

  /** -------- Fetch Course Resources (Including E-books) -------- */
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

    // Filter e-books (PDF, DOCX, etc.) and return them separately if needed
    const eBooks = data.files.filter(
      (file) =>
        file.type === 'pdf' || file.type === 'docx' || file.type === 'epub',
    );

    return {
      allResources: data.files, // Return all resources (videos, articles, PDFs, etc.)
      eBooks: eBooks, // Return only the e-books (if needed separately)
    };
  }

  /** -------- Fetch Course Articles -------- */
  async getCourseArticles(courseId: string) {
    const token = await this.getAccessToken();

    const { data } = await this.httpService.get(
      `${this.learnBase}/portal/${encodeURIComponent(this.portal)}/course/${courseId}/article`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
        },
      },
    );

    return data;
  }

  /** -------- Fetch Course Data by URL -------- */
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

  /** -------- Optional: Complete Course (if needed for reporting purposes) -------- */
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
}
