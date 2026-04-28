import { useState, useEffect } from 'react';
import { publicClient, FACTORY_ADDRESS, TOURNAMENT_FACTORY_ABI, TOURNAMENT_ABI } from '@/lib/web3';
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
  liveUri: string;
  rawState: number;
  agentKeys: string[];
}

export function useTournaments() {
  const [tournaments, setTournaments] = useState<ContractTournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTournaments() {
      try {
        if (FACTORY_ADDRESS === "0x0000000000000000000000000000000000000000") {
          console.warn("Factory address not configured.");
          setLoading(false);
          return;
        }
        const addresses = await publicClient.readContract({
          address: FACTORY_ADDRESS,
          abi: TOURNAMENT_FACTORY_ABI,
          functionName: 'getTournaments'
        }) as `0x${string}`[];

        const results = await Promise.all(addresses.map(async (address) => {
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

          // state: 0 = Registration, 1 = Active, 2 = Finished
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
            mode: 'Solo', // Can be derived or mocked
            slots: `${agentKeys.length}/${config[3].toString()}`,
            timeLabel: state === 0 ? 'STARTS AT' : 'ENDED',
            timeValue: new Date(Number(config[5]) * 1000).toLocaleString(),
            reward: `${Number(1)} 0G`, // Example math
            rewardValue: Number(config[2]),
            closesAt: 0,
            createdAt: Number(config[6]) * 1000,
            address: address,
            liveUri: config[9],
            rawState: state,
            agentKeys: agentKeys.map(k => k.toString())
          } as ContractTournament;
        }));

        setTournaments(results);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchTournaments();
  }, []);

  return { tournaments, loading };
}
