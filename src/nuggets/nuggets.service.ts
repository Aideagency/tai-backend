import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NuggetEntity, NuggetType } from 'src/database/entities/nugget.entity';
import { CreateNuggetDto } from './dtos/create-nugget.dto';
import {
  NuggetRepository,
  NuggetSearchParams,
} from 'src/repository/nuggets/nugget.repository';
import { NuggetSearchQueryDto } from './dtos/nugget-search-query.dto';
import { UpdateNuggetDto } from './dtos/update-nugget.dto';

@Injectable()
export class NuggetService {
  constructor(private readonly nuggetRepository: NuggetRepository) {}

  // ---------- Create ----------
  async createNugget(
    dto: CreateNuggetDto,
    adminId?: number | null,
  ): Promise<NuggetEntity | undefined> {
    return this.nuggetRepository.createNugget({
      body: dto.body,
      nuggetType: dto.nuggetType,
      publishAt: dto.publishAt ?? null,
      adminId: adminId ?? null,
      title: dto.title ?? null,
    });
  }

  async updateNugget(
    nuggetId: number,
    dto: UpdateNuggetDto,
    adminId?: number | null,
  ): Promise<NuggetEntity> {
    const nugget = await this.nuggetRepository.findOne({ id: nuggetId });
    if (!nugget) throw new NotFoundException('Nugget not found');

    // Optional: if you want only the creator admin to update, enforce here.
    // If your NuggetEntity has admin relation loaded differently, adjust accordingly.
    if (
      adminId &&
      (nugget as any)?.admin?.id &&
      (nugget as any).admin.id !== adminId
    ) {
      throw new BadRequestException(
        'You are not allowed to update this nugget',
      );
    }

    // Only patch provided fields
    if (dto.title !== undefined) nugget.title = dto.title ?? null;
    if (dto.body !== undefined) nugget.body = dto.body; // rich text html string
    if (dto.nuggetType !== undefined) nugget.nuggetType = dto.nuggetType;
    if (dto.publishAt !== undefined) nugget.publishAt = dto.publishAt ?? null;

    const saved = await this.nuggetRepository.save(nugget);
    return saved;
  }

  async getNuggets(params: NuggetSearchQueryDto) {
    return this.nuggetRepository.searchPaginated(params);
  }

  // ---------- Daily (or latest fallback) ----------
  async getDailyNugget(type?: NuggetType, currentUserId?: number) {
    const nugget = await this.nuggetRepository.getDailyRotatingNugget(
      (type ?? NuggetType.GENERAL) as NuggetType,
    );

    return { nugget: nugget ?? null };
  }

  // ---------- Details / info with engagement ----------
  async getNuggetInfo(nuggetId: number, currentUserId?: number) {
    const nugget = await this.nuggetRepository.getNuggetWithAdmin(nuggetId);
    if (!nugget) throw new NotFoundException('Nugget not found');

    const engagement = await this.nuggetRepository.getEngagementCounts(
      nugget.id,
      currentUserId,
    );

    return { nugget, engagement };
  }

  async getNuggetWithEngagementStats(nuggetId: number) {
    return this.nuggetRepository.getNuggetWithEngagementStats(nuggetId);
  }

  // ---------- Likes ----------
  async likeNugget(nuggetId: number, userId: number) {
    const exists = await this.nuggetRepository.likeExists(nuggetId, userId);
    if (exists) throw new BadRequestException('Already liked');

    // ensure nugget exists
    const n = await this.nuggetRepository.findOne({ id: nuggetId });
    if (!n) throw new NotFoundException('Nugget not found');

    await this.nuggetRepository.addLike(nuggetId, userId);
    return { success: true };
  }

  async unlikeNugget(nuggetId: number, userId: number) {
    // no error if not liked — idempotent
    const n = await this.nuggetRepository.findOne({ id: nuggetId });
    if (!n) throw new NotFoundException('Nugget not found');
    await this.nuggetRepository.removeLike(nuggetId, userId);
    return { success: true };
  }

  // ---------- Comments ----------
  async addComment(nuggetId: number, userId: number, comment: string) {
    // ensure nugget exists
    const n = await this.nuggetRepository.findOne({ id: nuggetId });
    if (!n) throw new NotFoundException('Nugget not found');

    const saved = await this.nuggetRepository.addComment(
      nuggetId,
      userId,
      comment,
    );
    return { success: true, comment: saved };
  }

  async deleteComment(
    commentId: number,
    options: { userId?: number; isAdmin?: boolean },
  ) {
    const ok = await this.nuggetRepository.deleteComment(commentId, options);
    if (!ok) throw new NotFoundException('Comment not found');
    return { success: true };
  }

  async deleteNugget(nuggetId: number) {
    await this.nuggetRepository.softDelete(nuggetId);

    return { success: true };
  }

  async listComments(
    nuggetId: number,
    page = 1,
    pageSize = 20,
    orderBy: 'createdAt' | 'id' = 'id',
    orderDir: 'ASC' | 'DESC' = 'DESC',
  ) {
    return this.nuggetRepository.listCommentsPaginated({
      nuggetId,
      page,
      pageSize,
      orderBy,
      orderDir,
    });
  }

  // ---------- Share ----------
  /**
   * Increments a share counter (if you added one) and returns a
   * preformatted share text ensuring attribution.
   */
  async shareNugget(nuggetId: number) {
    const nugget = await this.nuggetRepository.findOne({ id: nuggetId });
    if (!nugget) throw new NotFoundException('Nugget not found');

    // Increment counter (no-op if your entity lacks shareCount)
    await this.nuggetRepository
      .incrementShareCount(nuggetId)
      .catch(() => void 0);

    const shareText = `${nugget.body}\n\n— via Agudah App`;
    return { success: true, shareText };
  }

  async addNuggetsFromJson() {
    const nuggetsData = [
      {
        category: 'SINGLE',
        body: 'The period of singleness should be spent in becoming the best version of yourself.',
      },
      {
        category: 'SINGLE',
        body: 'The best gift you can give your spouse is a ‘whole’ you.',
      },
      {
        category: 'SINGLE',
        body: 'If you don’t know where you’re going, how do you know who to go on the journey with? Find your ‘purpose’ while single.',
      },
      {
        category: 'SINGLE',
        body: 'Build a strong tribe while single, it’s a life saver.',
      },
      {
        category: 'SINGLE',
        body: 'Enjoy your period of singleness, you’ll never get that time back.',
      },
      {
        category: 'SINGLE',
        body: 'The greatest tragedy in life is going through life without really coming to terms with who you are.',
      },
      {
        category: 'SINGLE',
        body: 'Our identity is not in our work, looks, skills or social network but in who God says we are.',
      },
      {
        category: 'SINGLE',
        body: 'You are not ordinary. You have the DNA of God inside of you.',
      },
      {
        category: 'SINGLE',
        body: 'Add value to your life as a single person, it ensures that you bring something to the table in marriage.',
      },
      {
        category: 'SINGLE',
        body: 'Defining your core values as a single person serves as a map for your life and determines who should be in your circle.',
      },

      {
        category: 'MARRIED',
        body: 'The purpose of dating is to determine the suitability of a partner for marriage.',
      },
      {
        category: 'MARRIED',
        body: 'Dating should be intentional with an end goal in mind.',
      },
      {
        category: 'MARRIED',
        body: 'Dating is a time of deep communication, research and soul searching.',
      },
      {
        category: 'MARRIED',
        body: 'The dating period lays the foundation for your marriage. Build carefully.',
      },
      {
        category: 'MARRIED',
        body: 'Invest time in really getting to know your partner during dating. It’ll save you heartache.',
      },
      {
        category: 'MARRIED',
        body: 'Cultivate a deep friendship with your partner when dating. It’s the glue that holds a relationship together.',
      },
      {
        category: 'MARRIED',
        body: 'Dating is in stages. Gradually going from one stage to another saves the day.',
      },
      {
        category: 'MARRIED',
        body: 'Compatibility is non-negotiable in a romantic relationship.',
      },
      {
        category: 'MARRIED',
        body: 'Dating should bring you into more alignment with your partner. If that’s not happening, it’s worth finding out why.',
      },
      {
        category: 'MARRIED',
        body: 'What is dating without truly having fun? Make memories that make you smile.',
      },
      {
        category: 'MARRIED',
        body: 'Sexual purity thrives where boundaries exist.',
      },
      {
        category: 'MARRIED',
        body: 'Dating towards marriage is serious business; treat it as such.',
      },
      { category: 'MARRIED', body: 'Date from fullness, not from emptiness.' },
      {
        category: 'MARRIED',
        body: 'In dating, observation reveals what words conceal.',
      },
      {
        category: 'MARRIED',
        body: 'The decision on whom to marry is spiritual, intellectual, and emotional – never just one.',
      },

      {
        category: 'MARRIED',
        body: 'Great marriages don’t happen by accident, they’re worked at.',
      },
      {
        category: 'MARRIED',
        body: 'Conflict in marriage is not always bad but an opportunity to explore alternatives that you never thought of.',
      },
      {
        category: 'MARRIED',
        body: 'For marriage to succeed, each spouse will undergo pruning and refinement.',
      },
      {
        category: 'MARRIED',
        body: 'Marriage gives you the unique advantage of having the love of your life as your best friend.',
      },
      {
        category: 'MARRIED',
        body: 'Understanding your spouse’s personality in marriage helps you love better.',
      },
      {
        category: 'MARRIED',
        body: 'Marriage means more, better and bigger. When done properly, it increases your chances of a successful life.',
      },
      {
        category: 'MARRIED',
        body: 'The foundation of ‘happily ever after in marriage’ is a love that is unconditional.',
      },
      { category: 'MARRIED', body: 'Marriage is a covenant not a contract.' },
      {
        category: 'MARRIED',
        body: 'To truly enjoy marriage, the operative word should be ‘we’ not ‘I’.',
      },
      {
        category: 'MARRIED',
        body: 'Feelings alone will not sustain a marriage, love, God’s way will.',
      },
      {
        category: 'MARRIED',
        body: 'Your marriage goes beyond you. It affects humanity whether you realize it or not.',
      },
      {
        category: 'MARRIED',
        body: 'Marriage is the one institution that outlasts every season and generation.',
      },
      {
        category: 'MARRIED',
        body: 'Only unconditional love keeps a marriage standing — love, regardless.',
      },
      {
        category: 'MARRIED',
        body: 'One quiet gift of marriage: seeing your spouse grow because of you.',
      },
      {
        category: 'MARRIED',
        body: 'In marriage, the power of two conquers what one never could.',
      },
      {
        category: 'MARRIED',
        body: 'The secret to a strong marriage? Owning mistakes and striving to do better.',
      },

      {
        category: 'PARENT',
        body: 'The true success of your marriage is seen in the quality of adults your children raise.',
      },
      {
        category: 'PARENT',
        body: 'Our children will either add to the problems of the world or solve them. Which of them are you raising?',
      },
      {
        category: 'PARENT',
        body: 'Parenting is an assignment and failure at it has dire consequences.',
      },
      {
        category: 'PARENT',
        body: 'You will reproduce children who reflect who you are. Be the person you want your children to be.',
      },
      {
        category: 'PARENT',
        body: 'There are different seasons in parenting. Make the best use of each of them.',
      },
      {
        category: 'PARENT',
        body: 'Parents are the first leadership coaches that guide children into solving the world’s problems.',
      },
      {
        category: 'PARENT',
        body: 'Raising children to become adults with strong values is not a luxury but the secret of our survival as a people.',
      },
      {
        category: 'PARENT',
        body: '‘Train up a child’ is the key word not ‘train up an adult’.',
      },
      {
        category: 'PARENT',
        body: 'Values are caught, taught and must be modeled deliberately by parents.',
      },
      {
        category: 'PARENT',
        body: 'Parents chart the pathway that their children will eventually ride on.',
      },
      {
        category: 'PARENT',
        body: 'Destiny is nurtured in the soil of the family.',
      },
      {
        category: 'PARENT',
        body: 'Your life is the background against which your children’s future unfolds.',
      },
      {
        category: 'PARENT',
        body: 'Greatness in children is crafted, not chanced.',
      },
      {
        category: 'PARENT',
        body: 'A child’s sense of self begins in the family.',
      },
      {
        category: 'PARENT',
        body: 'A father is the first reflection of God a child ever knows.',
      },
    ];

    const allNugget = nuggetsData.map((n) => {
      const nugget = new NuggetEntity();
      nugget.body = n.body;
      nugget.nuggetType = n.category as NuggetType;
      return nugget;
    });

    return this.nuggetRepository.saveAll(allNugget);
  }
}
