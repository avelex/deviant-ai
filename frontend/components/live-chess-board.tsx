"use client";

import { useEffect, useState, useRef } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

interface LiveChessBoardProps {
  liveUri: string;
  isActive: boolean;
  playerWhiteId?: string;
  playerBlackId?: string;
}

export function LiveChessBoard({ liveUri, isActive, playerWhiteId, playerBlackId }: LiveChessBoardProps) {
  const [game, setGame] = useState(new Chess());
  const [connectionStatus, setConnectionStatus] = useState<string>("WAITING...");
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!liveUri) {
      const timeout = setTimeout(() => {
        setConnectionStatus(isActive ? "NO LIVE URI PROVIDED" : "TOURNAMENT NOT ACTIVE");
      }, 0);
      return () => clearTimeout(timeout);
    }

    const connectTimeout = setTimeout(() => {
      setConnectionStatus("CONNECTING...");
    }, 0);

    const ws = new WebSocket(liveUri);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus("CONNECTED");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'state' && data.fen) {
          setGame(new Chess(data.fen));
        } else if (data.type === 'move' && data.move) {
          setGame(prev => {
            const gameCopy = new Chess(data.fen || prev.fen());
            // If we didn't get a FEN but got a move, try to apply the move locally
            if (!data.fen) {
              try {
                gameCopy.move(data.move);
              } catch (e) {
                console.error("Failed to apply move locally", e);
              }
            }
            return gameCopy;
          });
        } else if (data.move) { // Fallback for old format
          setGame(prev => {
            const gameCopy = new Chess(prev.fen());
            try {
              gameCopy.move(data.move);
            } catch (e) {
              console.error("Failed to apply move locally (fallback)", e);
            }
            return gameCopy;
          });
        }
      } catch (err) {
        console.error("Failed to parse websocket message", err);
      }
    };

    ws.onclose = () => {
      setConnectionStatus("DISCONNECTED");
    };

    return () => {
      clearTimeout(connectTimeout);
      ws.close();
    };
  }, [liveUri, isActive]);

  const isWhiteTurn = game.turn() === 'w';
  const currentAgentId = isWhiteTurn ? playerWhiteId : playerBlackId;
  const currentTurnText = isWhiteTurn ? "WHITE" : "BLACK";

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full mb-6 border-b border-slate-100 dark:border-slate-800/50 pb-4 gap-4 sm:gap-0">
        <h3 className="font-display text-xl md:text-2xl font-light text-[#131b2e] dark:text-white uppercase mt-1 flex items-center gap-3">
          LIVE BROADCAST
          {connectionStatus === 'CONNECTED' && (
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </h3>

        {connectionStatus === 'CONNECTED' ? (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">TURN:</span>
            <div className="text-[10px] font-bold tracking-widest uppercase bg-slate-100 dark:bg-slate-800 text-[#131b2e] dark:text-white px-3 py-1.5 flex items-center gap-1">
              <span>{currentTurnText}</span>
              {currentAgentId && (
                <span className="text-[#00E5FF]"> (AGENT {currentAgentId})</span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500">
            CONNECTION: <span className="text-amber-500">{connectionStatus}</span>
          </div>
        )}
      </div>

      <div className="w-full max-w-[400px]">
        <Chessboard options={{ position: game.fen(), allowDragging: false, darkSquareStyle: { backgroundColor: "#1e293b" }, lightSquareStyle: { backgroundColor: "#f8fafc" } }} />
      </div>
    </div>
  );
}