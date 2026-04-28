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
  createdAt: number;
  address: string;
  owner: string;
  liveUri: string;
  rawState: number;
  slotPrice: bigint;
  agentKeys: string[];
  teeAddress: string;
  startedAt: number;
  finishedAt: number;
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
        });

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
          1: 'ACTIVE',
          2: 'FINISHED'
        };

        const owner = config[0];
        const teeAddress = config[1];
        const slotPrice = config[2];
        const maxSlots = config[3];
        const feeRate = config[4];
        const createdAt = config[5];
        const startedAt = config[6];
        const finishedAt = config[7];
        const id = config[8];
        const name = config[9];
        const category = config[10];
        const liveUri = config[11];

        return {
          id: id.toString(),
          title: name,
          status: statusMap[state] || 'FINISHED',
          mainIcon: state === 1 ? 'zap' : state === 0 ? 'clock' : 'lock',
          category: category,
          mode: 'Solo',
          slots: `${agentKeys.length}/${maxSlots.toString()}`,
          timeLabel: state === 0 ? 'STARTS AT' : 'ENDED',
          timeValue: new Date(Number(startedAt) * 1000).toLocaleString(),
          reward: `${Number(0)} 0G`,
          rewardValue: Number(slotPrice),
          finishedAt: Number(finishedAt) * 1000,
          createdAt: Number(createdAt) * 1000,
          address: address,
          owner: owner,
          teeAddress: teeAddress,
          liveUri: liveUri,
          rawState: state,
          slotPrice: slotPrice,
          startedAt: Number(startedAt) * 1000,
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
