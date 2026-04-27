"use client";

import { useEffect, useState, useRef } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

interface LiveChessBoardProps {
  liveUri: string;
  isActive: boolean;
}

export function LiveChessBoard({ liveUri, isActive }: LiveChessBoardProps) {
  const [game, setGame] = useState(new Chess());
  const [connectionStatus, setConnectionStatus] = useState<string>("WAITING...");
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!isActive || !liveUri) {
      setConnectionStatus(isActive ? "NO LIVE URI PROVIDED" : "TOURNAMENT NOT ACTIVE");
      return;
    }

    setConnectionStatus("CONNECTING...");
    const ws = new WebSocket(liveUri);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus("CONNECTED");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.move) {
          const gameCopy = new Chess(game.fen());
          gameCopy.move(data.move);
          setGame(gameCopy);
        }
      } catch (err) {
        console.error("Failed to parse websocket message", err);
      }
    };

    ws.onclose = () => {
      setConnectionStatus("DISCONNECTED");
    };

    return () => {
      ws.close();
    };
  }, [liveUri, isActive]);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="mb-4 text-[10px] font-bold tracking-widest uppercase text-slate-500">
        CONNECTION: <span className={connectionStatus === 'CONNECTED' ? 'text-[#00E5FF]' : 'text-amber-500'}>{connectionStatus}</span>
      </div>
      <div className="w-full max-w-[400px]">
        <Chessboard options={{ position: game.fen(), allowDragging: false, darkSquareStyle: { backgroundColor: "#1e293b" }, lightSquareStyle: { backgroundColor: "#f8fafc" } }} />
      </div>
    </div>
  );
}