import { useState, useEffect } from 'react';
import { useReadContract, usePublicClient } from 'wagmi';
import { FACTORY_ADDRESS, TOURNAMENT_FACTORY_ABI, TOURNAMENT_ABI } from '@/lib/web3';
import { TournamentStatus } from '@/components/tournament-card';

export interface ContractTournament {
  id: string;
  title: string;
  status: TournamentStatus;
  mainIcon: 'zap' | 'clock' | 'lock';
  category: string;
  mode: string;
  slots: string;
  timeLabel: string;
  timeValue: string;
  reward: string;
  rewardValue: number;
  closesAt: number;
  createdAt: number;
  address: string;
  owner: string;
  liveUri: string;
  rawState: number;
  slotPrice: bigint;
  agentKeys: string[];
  teeAddress: string;
  startTime: number;
}

export function useTournaments() {
  const [tournaments, setTournaments] = useState<ContractTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const publicClient = usePublicClient();

  const { data: addresses, isLoading: isAddressesLoading, refetch: refetchAddresses } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: TOURNAMENT_FACTORY_ABI,
    functionName: 'getTournaments',
  });

  const fetchTournamentDetails = async () => {
    if (!addresses || !publicClient) return;
    setLoading(true);

    try {
      const results = await Promise.all((addresses as `0x${string}`[]).map(async (address) => {
        const config = await publicClient.readContract({
          address,
          abi: TOURNAMENT_ABI,
          functionName: 'config'
        }) as any;

        const state = await publicClient.readContract({
          address,
          abi: TOURNAMENT_ABI,
          functionName: 'state'
        }) as number;

        let agentKeys: bigint[] = [];
        try {
          agentKeys = await publicClient.readContract({
            address,
            abi: TOURNAMENT_ABI,
            functionName: 'getAgentKeys'
          }) as bigint[];
        } catch (e) {
          console.error("Failed to fetch agent keys", e);
        }

        const statusMap: Record<number, TournamentStatus> = {
          0: 'REGISTRATION',
          1: 'LIVE',
          2: 'FINISHED'
        };

        return {
          id: config[6].toString(),
          title: config[7],
          status: statusMap[state] || 'FINISHED',
          mainIcon: state === 1 ? 'zap' : state === 0 ? 'clock' : 'lock',
          category: config[8],
          mode: 'Solo',
          slots: `${agentKeys.length}/${config[3].toString()}`,
          timeLabel: state === 0 ? 'STARTS AT' : 'ENDED',
          timeValue: new Date(Number(config[5]) * 1000).toLocaleString(),
          reward: `${Number(1)} 0G`,
          rewardValue: Number(config[2]),
          closesAt: 0,
          createdAt: Number(config[6]) * 1000,
          address: address,
          owner: config[0],
          teeAddress: config[1],
          liveUri: config[9],
          rawState: state,
          slotPrice: BigInt(config[2]),
          startTime: Number(config[5]) * 1000,
          agentKeys: agentKeys.map(k => k.toString())
        } as ContractTournament;
      }));

      setTournaments(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (addresses) {
      fetchTournamentDetails();
    } else if (!isAddressesLoading && loading) {
      setLoading(false);
    }
  }, [addresses, publicClient, isAddressesLoading]);

  const refresh = async () => {
    await refetchAddresses();
    await fetchTournamentDetails();
  };

  return { tournaments, loading: loading || isAddressesLoading, refresh };
}
