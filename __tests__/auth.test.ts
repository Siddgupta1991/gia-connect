import { describe, expect, it } from 'vitest';
import { LocalRepository, memoryStore } from '../src/data/localRepository';
import { testCtx } from './helpers';

const input = {
  name: 'Priya Singh',
  mobile: '9876543210',
  industryName: 'Singh Textiles',
  plotNo: '55',
  username: 'priya',
  password: 'secret1',
};

describe('auth', () => {
  it('seed logins work and wrong password fails', async () => {
    const repo = new LocalRepository(memoryStore(), testCtx());
    await repo.init();
    expect((await repo.login('admin', 'Admin@123')).role).toBe('admin');
    expect((await repo.login('member', 'Member@123')).role).toBe('member');
    expect((await repo.login('moderator', 'Moderator@123')).role).toBe('moderator');
    await expect(repo.login('member', 'wrong')).rejects.toThrow('Wrong username or password');
  });

  it('new accounts are always members and never expose passwords', async () => {
    const repo = new LocalRepository(memoryStore(), testCtx());
    await repo.init();
    const u = await repo.register({ ...input, role: 'admin' } as typeof input);
    expect(u.role).toBe('member');
    expect('password' in u).toBe(false);
    expect((await repo.listUsers()).some((x) => 'password' in x)).toBe(false);
  });

  it('rejects duplicate usernames and bad input', async () => {
    const repo = new LocalRepository(memoryStore(), testCtx());
    await repo.init();
    await expect(repo.register({ ...input, username: 'Admin' })).rejects.toThrow('already taken');
    await expect(repo.register({ ...input, mobile: '123' })).rejects.toThrow('10 digit');
    await expect(repo.register({ ...input, password: '123' })).rejects.toThrow('at least 6');
  });

  it('reset demo data restores the seed', async () => {
    const repo = new LocalRepository(memoryStore(), testCtx());
    await repo.init();
    await repo.register(input);
    await repo.resetDemoData();
    expect((await repo.listUsers()).some((u) => u.username === 'priya')).toBe(false);
  });
});
