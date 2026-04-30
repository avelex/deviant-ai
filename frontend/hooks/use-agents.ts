import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract, usePublicClient } from 'wagmi';
import { DEVIANT_ID_ADDRESS, DEVIANT_NFT_ABI } from '@/lib/web3';
import { AgentStatus } from '@/components/agent-card';

export interface Agent {
  id: string;
  name: string;
  status: AgentStatus;
  type: string;
  model: string;
  performance: string;
  uptime: string;
}

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const { data: totalSupply, isLoading: isTotalSupplyLoading, refetch: refetchTotalSupply } = useReadContract({
    address: DEVIANT_ID_ADDRESS,
    abi: DEVIANT_NFT_ABI,
    functionName: 'totalSupply',
  });

  console.log('totalSupply', totalSupply);

  const fetchAgents = useCallback(async () => {
    if (!totalSupply || !publicClient || !address) {
      if (!isTotalSupplyLoading) setLoading(false);
      return;
    }
    setLoading(true);

    try {
      const supply = Number(totalSupply);
      const tokenIds = Array.from({ length: supply }, (_, i) => i);

      // Batch read owners
      const ownersCalls = tokenIds.map(id => ({
        address: DEVIANT_ID_ADDRESS,
        abi: DEVIANT_NFT_ABI,
        functionName: 'ownerOf',
        args: [BigInt(id)],
      }));

      const ownersResults = await publicClient.multicall({
        contracts: ownersCalls as any,
        allowFailure: true,
      });

      // Filter token IDs owned by the connected user
      const ownedTokenIds = tokenIds.filter((id, index) => {
        const result = ownersResults[index];
        return result.status === 'success' && (result.result as string).toLowerCase() === address.toLowerCase();
      });

      if (ownedTokenIds.length === 0) {
        setAgents([]);
        setLoading(false);
        return;
      }

      // Batch read intelligent datas for owned tokens
      const dataCalls = ownedTokenIds.map(id => ({
        address: DEVIANT_ID_ADDRESS,
        abi: DEVIANT_NFT_ABI,
        functionName: 'intelligentDatasOf',
        args: [BigInt(id)],
      }));

      const datasResults = await publicClient.multicall({
        contracts: dataCalls as any,
        allowFailure: true,
      });

      const formattedAgents: Agent[] = ownedTokenIds.map((id, index) => {
        const result = datasResults[index];
        let hasScript = false;

        if (result.status === 'success' && Array.isArray(result.result)) {
          const datas = result.result as { dataDescription: string, dataHash: string }[];
          hasScript = datas.some(d => d.dataDescription === 'script');
        }

        return {
          id: id.toString(),
          name: `Agent ${id}`,
          status: hasScript ? 'ACTIVE' : 'IDLE',
          type: 'Autonomous',
          model: '0G-Default',
          performance: 'N/A',
          uptime: '100%',
        };
      });

      setAgents(formattedAgents);
    } catch (err) {
      console.error("Failed to fetch agents", err);
    } finally {
      setLoading(false);
    }
  }, [totalSupply, address, publicClient, isTotalSupplyLoading]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchAgents();
    }, 0);
    return () => clearTimeout(timeout);
  }, [fetchAgents]);

  const refresh = async () => {
    await refetchTotalSupply();
    await fetchAgents();
  };

  return { agents, loading: loading || isTotalSupplyLoading, refresh };
}
