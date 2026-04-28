import { zeroGGalileo, config, publicClient, TOURNAMENT_FACTORY_ABI, TOURNAMENT_ABI } from './web3';
import { describe, it, expect } from 'vitest';

describe('web3 config', () => {
  it('should have zeroGGalileo chain defined correctly', () => {
    expect(zeroGGalileo.id).toBe(16602);
    expect(zeroGGalileo.name).toBe('0G Galileo Testnet');
  });

  it('should have wagmi config defined', () => {
    expect(config).toBeDefined();
  });

  it('should have publicClient defined', () => {
    expect(publicClient).toBeDefined();
  });

  it('should have TOURNAMENT_FACTORY_ABI with getTournaments and createTournament', () => {
    const getTournaments = TOURNAMENT_FACTORY_ABI.find(item => item.type === 'function' && item.name === 'getTournaments');
    const createTournament = TOURNAMENT_FACTORY_ABI.find(item => item.type === 'function' && item.name === 'createTournament');
    expect(getTournaments).toBeDefined();
    expect(createTournament).toBeDefined();
  });

  it('should have TOURNAMENT_ABI with config, state, and getAgentKeys', () => {
    const configFn = TOURNAMENT_ABI.find(item => item.type === 'function' && item.name === 'config');
    const stateFn = TOURNAMENT_ABI.find(item => item.type === 'function' && item.name === 'state');
    const getAgentKeysFn = TOURNAMENT_ABI.find(item => item.type === 'function' && item.name === 'getAgentKeys');
    
    expect(configFn).toBeDefined();
    expect(stateFn).toBeDefined();
    expect(getAgentKeysFn).toBeDefined();
  });
});
