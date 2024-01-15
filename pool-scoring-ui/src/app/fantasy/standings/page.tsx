"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Tab,
  Tabs,
  TabList,
  TabPanel,
  TabPanels,
  VStack,
  Text,
  useColorModeValue,
  Badge,
} from "@chakra-ui/react";
import axios from "axios";
import { apiUrl } from "../../../../utils/utils";

const StandingsPage = () => {
  const highlightBg = useColorModeValue("blue.200", "blue.500");
  const normalBg = useColorModeValue("gray.300", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");

  const [singlesGameData, setSinglesGameData] = useState([]);
  const [doublesGameData, setDoublesGameData] = useState([]);
  const [singlesTournamentData, setSinglesTournamentGameData] = useState([]);
  const [doublesTournamentData, setDoublesTournamentGameData] = useState([]);
  const [singlesStrokeData, setSinglesStrokeGameData] = useState([]);
  const [doublesStrokeData, setDoublesStrokeGameData] = useState([]);
  const [mode, setMode] = useState(true);
  const [selectedTab, setSelectedTab] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const seasonId = 1;

      const gamesResS = await axios.get(
        `http://${apiUrl}/average-points-per-tournament-game`,
        { params: { mode: "singles", seasonId } }
      );

      const gamesResD = await axios.get(
        `http://${apiUrl}/average-points-per-tournament-game`,
        { params: { mode: "doubles", seasonId } }
      );

      const tournamentsResS = await axios.get(
        `http://${apiUrl}/average-points-per-game`,
        { params: { mode: "singles", seasonId } }
      );

      const tournamentsResD = await axios.get(
        `http://${apiUrl}/average-points-per-game`,
        { params: { mode: "doubles", seasonId } }
      );

      const pptSingles = await axios.get(
        `http://${apiUrl}/player-ppt?mode=singles&seasonId=`
      );
      const pptDoubles = await axios.get(
        `http://${apiUrl}/player-ppt?mode=doubles&seasonId=`
      );

      // Sort the data
      const sortData = (data: any) => {
        // Convert the object into an array of [key, value] pairs
        let items = Object.entries(data).map(([name, number]) => ({
          name,
          number,
        }));

        // Sort the array based on the float value of the number property
        items.sort(
          (a: any, b: any) => parseFloat(b.number) - parseFloat(a.number)
        );

        return items;
      };

      setSinglesGameData(sortData(gamesResS.data) as any);
      setDoublesGameData(sortData(gamesResD.data) as any);
      setSinglesTournamentGameData(sortData(tournamentsResS.data) as any);
      setDoublesTournamentGameData(sortData(tournamentsResD.data) as any);
      setSinglesStrokeGameData(sortData(pptSingles.data) as any);
      setDoublesStrokeGameData(sortData(pptDoubles.data) as any);
    };

    fetchData();
  }, []);

  function normalize(values: any) {
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);
    const scale = maxVal - minVal + 0.1 * maxVal;
    return values.map((val: any) => (val - minVal) / scale);
  }

  function calculateOS(ppg: any, pps: any, ppt: any) {
    const normPPG = normalize(ppg.map((p: any) => parseFloat(p.number)));
    const normPPS = normalize(pps.map((p: any) => parseFloat(p.number)));
    const normPPT = normalize(ppt.map((p: any) => parseFloat(p.number)));

    let scores: any = {};
    ppg.forEach((player: any, index: any) => {
      const ppsIndex = pps.findIndex((p: any) => p.name === player.name);
      const pptIndex = ppt.findIndex((p: any) => p.name === player.name);

      scores[player.name] =
        0.5 * normPPG[index] +
        0.3 * (ppsIndex !== -1 ? normPPS[ppsIndex] : 0) +
        0.2 * (pptIndex !== -1 ? normPPT[pptIndex] : 0);
    });

    return scores;
  }

  const calculateOverallScore = () => {
    const scores = calculateOS(
      singlesGameData,
      singlesStrokeData,
      singlesTournamentData
    );

    // Convert the scores object into an array and sort it
    const sortedPlayers = Object.entries(scores)
      .map(([name, score]) => ({ name, score }))
      .sort((a: any, b: any) => b.score - a.score);

    // Map the sorted players to the format used by renderListItem
    return sortedPlayers.map((player, index) => ({
      index,
      name: player.name,
      score: player.score,
    }));
  };

  const renderListItem = (playerData: any) => {
    const { index, name, score } = playerData;
    const isTopPlayer = index < 2;

    return (
      <Box
        key={index}
        p={4}
        bg={isTopPlayer ? highlightBg : normalBg}
        color={textColor}
        borderRadius="lg"
        boxShadow="md"
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        w="100%"
        h="60px"
      >
        {selectedTab ? null : (
          <Text fontWeight={isTopPlayer ? "bold" : "normal"}>
            {index + 1}. {name} - Score: {score ? score.toFixed(3) : 0.0}
          </Text>
        )}
        {isTopPlayer && <Badge colorScheme="green">Top</Badge>}
      </Box>
    );
  };

  return (
    <Box
      p={4}
      bg={useColorModeValue("gray.50", "gray.800")}
      minH="100vh"
      maxW="480px" // Max width clamped
      mx="auto"
    >
      <Tabs
        isFitted
        variant="enclosed"
        size="md"
        onChange={() => {
          setSelectedTab(!selectedTab);
        }}
      >
        <TabList mb="1em">
          <Tab>Standings</Tab>
          <Tab>Qualification</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <VStack spacing={4}>
              {Array.from({ length: 10 }, (_, i) => renderListItem(i))}
            </VStack>
          </TabPanel>
          <TabPanel>
            <VStack spacing={4}>
              {calculateOverallScore().map((obj: any, index: number) => {
                return <>{renderListItem(obj)}</>;
              })}
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default StandingsPage;
