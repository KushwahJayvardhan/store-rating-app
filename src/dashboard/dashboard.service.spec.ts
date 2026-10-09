import { Repository } from 'typeorm';
import { Rating } from '../entities/rating.entity';
import { Store } from '../entities/store.entity';
import { User } from '../entities/user.entity';
import { DashboardService } from './dashboard.service';

jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));

describe('DashboardService', () => {
  it('returns repository counts without loading records', async () => {
    const usersRepository = {
      count: jest.fn().mockResolvedValue(12),
    };
    const storesRepository = {
      count: jest.fn().mockResolvedValue(4),
    };
    const ratingsRepository = {
      count: jest.fn().mockResolvedValue(27),
    };
    const service = new DashboardService(
      usersRepository as unknown as Repository<User>,
      storesRepository as unknown as Repository<Store>,
      ratingsRepository as unknown as Repository<Rating>,
    );

    await expect(service.getStatistics()).resolves.toEqual({
      totalUsers: 12,
      totalStores: 4,
      totalRatings: 27,
    });
    expect(usersRepository.count.mock.calls).toHaveLength(1);
    expect(storesRepository.count.mock.calls).toHaveLength(1);
    expect(ratingsRepository.count.mock.calls).toHaveLength(1);
  });
});
