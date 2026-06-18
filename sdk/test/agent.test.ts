jest.mock('axios', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import { KubernaSDK } from '../src/index.js';
import axios from 'axios';

const mockedAxios = axios as unknown as jest.Mock;

describe('AgentManager', () => {
  const sdk = new KubernaSDK({ apiKey: 'test-key', baseUrl: 'https://api.test.com/api' });

  beforeEach(() => {
    mockedAxios.mockClear();
  });

  it('should create an agent', async () => {
    mockedAxios.mockResolvedValueOnce({
      data: { success: true, data: { id: 'a1', name: 'Test Agent', status: 'created' } },
    });

    const result = await sdk.agent.create({ name: 'Test Agent', framework: 'LangChain' });
    expect(result.id).toBe('a1');
    expect(result.status).toBe('created');
  });

  it('should deploy an agent', async () => {
    mockedAxios.mockResolvedValueOnce({
      data: { success: true, data: { id: 'a1', name: 'Test Agent', status: 'deploying', deploymentUrl: 'https://example.com' } },
    });

    const result = await sdk.agent.deploy('a1');
    expect(result.status).toBe('deploying');
  });

  it('should reject invalid framework', async () => {
    await expect(sdk.agent.create({ name: 'Bad Agent', framework: 'InvalidFramework' as never })).rejects.toThrow();
  });
});
