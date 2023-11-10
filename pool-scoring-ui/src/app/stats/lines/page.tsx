"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Box, Table, Thead, Tbody, Tr, Th, Td } from "@chakra-ui/react";

const BettingLines = () => {
  const [playerAverages, setPlayerAverages] = useState({
    singles: [],
    doubles: [],
  });
  const [bettingLines, setBettingLines] = useState([]);

  useEffect(() => {
    const fetchAverages = async () => {
      try {
        const [singlesResponse, doublesResponse] = await Promise.all([
          axios.get(
            "http://localhost:8000/average-points-per-game?mode=singles"
          ),
          axios.get(
            "http://localhost:8000/average-points-per-game?mode=doubles"
          ),
        ]);

        setPlayerAverages({
          singles: singlesResponse.data,
          doubles: doublesResponse.data,
        });
      } catch (error) {
        console.error("Error fetching averages:", error);
      }
    };

    fetchAverages();
  }, []);

  useEffect(() => {
    function getRandomInt(min: number, max: number) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function gaussianRandom(mean = 0, stdev = 1) {
      const u = 1 - Math.random(); // Converting [0,1) to (0,1]
      const v = Math.random();
      const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
      // Transform to the desired mean and standard deviation:
      return z * stdev + mean;
    }

    const calculateBettingLines = () => {
      const lines = [];

      if (Object.keys(playerAverages.singles).length > 0) {
        // Calculate lines for singles
        for (const [player, avg] of Object.entries(playerAverages.singles)) {
          lines.push({
            player,
            mode: "Singles",
            line: gaussianRandom(parseFloat(avg), getRandomInt(-2, 2)),
          });
        }
      }

      if (Object.keys(playerAverages.doubles).length > 0) {
        // Calculate lines for doubles
        for (const [player, avg] of Object.entries(playerAverages.doubles)) {
          lines.push({
            player,
            mode: "Doubles",
            line: gaussianRandom(parseFloat(avg), getRandomInt(-4, 3)),
          });
        }
      }

      setBettingLines(lines as any);
    };

    calculateBettingLines();
  }, [playerAverages]);

  return (
    <Box>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Player</Th>
            <Th>Mode</Th>
            <Th isNumeric>Avg PPG</Th>
            <Th>Over/Under</Th>
          </Tr>
        </Thead>
        <Tbody>
          {bettingLines.map((line: any) => {
            if (!line.line) {
              return null;
            }

            return (
              <Tr key={`${line.player}-${line.mode}`}>
                <Td>{line.player}</Td>
                <Td>{line.mode}</Td>
                <Td isNumeric>{line.line.toFixed(1)}</Td>
                <Td>{line.overUnder}</Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </Box>
  );
};

export default BettingLines;
