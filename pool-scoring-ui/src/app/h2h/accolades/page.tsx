"use client";
import { ArrowDownIcon, ArrowUpIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Center,
  Container,
  Flex,
  HStack,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  Text,
  ModalHeader,
  ModalOverlay,
  Progress,
  Select,
  VStack,
  Circle,
} from "@chakra-ui/react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState, useReducer, useEffect } from "react";
import { apiUrl } from "../../../../utils/utils";

const playerData = [
  { name: "Player 1", score: 0.82, trend: "up" },
  { name: "Player 2", score: 0.82, trend: "down" },
  { name: "Player 3", score: 0.82, trend: "up" },
  { name: "Player 4", score: 0.82, trend: "" },
  { name: "Player 5", score: 0.82, trend: "up" },
  { name: "Player 6", score: 0.82, trend: "down" },
  { name: "Player 7", score: 0.82, trend: "up" },
  { name: "Player 8", score: 0.82, trend: "" },
  { name: "Player 9", score: 0.82, trend: "up" },
  { name: "Player 10", score: 0.82, trend: "down" },
];

const accoladeCategories = [
  { name: "First Team", color: "#2E8B57" },
  { name: "Second Team", color: "#2F5F4F" },
  { name: "Third Team", color: "#8FA000" },
  { name: "Not Selected", color: "gray.700" },
];

const accoladeTexts: any = {
  "First Team": "On Track for 1st Team",
  "Second Team": "On Track for 2nd Team",
  "Third Team": "On Track for 3rd Team",
  "Not Selected": "Not on Track For Selection",
};

const MVPCategories = [
  { name: "First", color: "#CC9E00" },
  { name: "Second", color: "#C0C0C0" },
  { name: "Third", color: "#CD7F32" },
  { name: "Not Selected", color: "gray.700" },
];

const MVPTexts: any = {
  First: "On Track for Statistical MVP",
  Second: "On Track for Runner Up",
  Third: "On Track for 3rd Place",
  "Not Selected": "Not on Track For Selection",
};

const getNameIndex = (name: string, arr: any) => {
  let index = 0;
  for (const entry of arr) {
    if (entry.name == name || entry.player == name) {
      return index;
    }
    index += 1;
  }

  return -1;
};

const createPlayers = (
  a: any,
  b: any,
  c: any,
  d: any,
  e: any,
  f: any,
  g: any,
  h: any,
  i: any,
  j: any
) => {
  let objS: any = [];
  let objD: any = [];

  for (const entry of a) {
    const bInd = getNameIndex(entry.name, b);
    const eInd = getNameIndex(entry.name, e);
    const iInd = getNameIndex(entry.name, i);

    objS.push({
      name: entry.name,
      PPG: parseFloat(entry.number),
      PPT: parseFloat(b[bInd] ? b[bInd].number : 0),
      PPS: parseFloat(e[eInd] ? e[eInd].number : 0),
      BST: parseFloat(g[entry.name]["best"]["totalFpts"]),
      WRST: parseFloat(g[entry.name]["worst"]["totalFpts"]),
      PERC: parseFloat(i[iInd] ? i[iInd].winPercentage : 0),
    });
  }

  for (const entry of c) {
    const dInd = getNameIndex(entry.name, d);
    const fInd = getNameIndex(entry.name, f);
    const jInd = getNameIndex(entry.name, j);

    objD.push({
      name: entry.name,
      PPG: parseFloat(entry.number),
      PPT: parseFloat(d[dInd] ? d[dInd].number : 0),
      PPS: parseFloat(f[fInd] ? f[fInd].number : 0),
      BST: parseFloat(h[entry.name]?.best.totalFpts as any),
      WRST: parseFloat(h[entry.name]?.worst.totalFpts as any),
      PERC: parseFloat(j[jInd] ? j[jInd].winPercentage : 0),
    });
  }

  return [objS, objD];
};

type Player = {
  name: string;
  PPG: number;
  PPT: number;
  PPS: number;
  BST: number;
  WRST: number;
};

// A utility type for the sorting order
type SortOrder = "asc" | "desc";

function calculateOPS(player: Player) {
  const weightPPG = 0.45;
  const weightPPT = 0.175;
  const weightPPS = 0.25;
  const weightBST = 0.075;
  const weightWRST = 0.05;

  const OPS =
    weightPPG * player.PPG +
    weightPPT * player.PPT +
    weightPPS * player.PPS +
    weightBST * player.BST +
    weightWRST * player.WRST;

  return OPS;
}

function scalePercentageToFive(value: number) {
  // Ensure the value is within the range [0, 100]
  value = Math.min(100, Math.max(0, value));

  // Scale the value to the range [0, 5]
  return value / 20;
}

function calculateMVP(player: any, WPS: any, WPD: any) {
  const weightPS = 0.6;
  const weightWPS = 0.25;
  const weightWPD = 0.15;

  if (!WPS?.winPercentage || !WPD?.winPercentage) {
    return 0;
  }

  WPS = parseFloat(WPS.winPercentage);
  WPD = parseFloat(WPD.winPercentage);

  const OPS = player.averageScore; // Using averageScore from averagedPlayers

  const MVP =
    weightPS * OPS +
    weightWPS * scalePercentageToFive(WPS) +
    weightWPD * scalePercentageToFive(WPD);

  return MVP;
}

const DualProgressBar = ({ percentage1, percentage2 }: any) => {
  return (
    <Box
      bg="gray.200"
      height="24px"
      width="300px" // Set the width to 300px
      borderRadius="full"
      position="relative"
      overflow="hidden"
    >
      <Box
        bg="green.400"
        height="100%"
        width={`${percentage1}%`}
        position="relative"
      ></Box>
      <Box
        bg="blue.400"
        height="100%"
        width={`${percentage2 - percentage1}%`}
        position="absolute"
        top="0"
        left={`${percentage1}%`}
        zIndex="0"
      ></Box>
    </Box>
  );
};

const AccoladeTrackerPage = () => {
  const [singlesGameData, setSinglesGameData] = useState([]);
  const [doublesGameData, setDoublesGameData] = useState([]);
  const [singlesTournamentData, setSinglesTournamentGameData] = useState([]);
  const [doublesTournamentData, setDoublesTournamentGameData] = useState([]);
  const [pptSinglesData, setPPTSinglesData] = useState([]);
  const [pptDoublesData, setPPTDoublesData] = useState([]);
  const [singlesBWT, setSinglesBWT] = useState<any>();
  const [doublesBWT, setDoublesBWT] = useState<any>();
  const [mode, setMode] = useState(true);
  const [players, setPlayers] = useState([]);
  const [, forceUpdate] = useReducer((x: any) => x + 1, 0);
  const [winSingles, setWinSingles] = useState([]);
  const [winDoubles, setWinDoubles] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState("");
  const [seasonProgress, setSeasonProgress] = useState<any>({});

  useEffect(() => {
    // Fetch the list of seasons
    const fetchSeasons = async () => {
      try {
        const response = await axios.get(`http://${apiUrl}/getSeasons`);
        setSeasons(response.data);
      } catch (error) {
        console.error("Error fetching seasons:", error);
      }
    };

    fetchSeasons();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const gamesResS = await axios.get(
        `http://${apiUrl}/average-points-per-tournament-game`,
        { params: { mode: "singles", seasonId: selectedSeason ?? null } }
      );

      const gamesResD = await axios.get(
        `http://${apiUrl}/average-points-per-tournament-game`,
        { params: { mode: "doubles", seasonId: selectedSeason ?? null } }
      );

      const tournamentsResS = await axios.get(
        `http://${apiUrl}/average-points-per-game`,
        { params: { mode: "singles", seasonId: selectedSeason ?? null } }
      );

      const tournamentsResD = await axios.get(
        `http://${apiUrl}/average-points-per-game`,
        { params: { mode: "doubles", seasonId: selectedSeason ?? null } }
      );

      const pptSingles = await axios.get(`http://${apiUrl}/player-ppt`, {
        params: { mode: "singles", seasonId: selectedSeason ?? null },
      });
      const pptDoubles = await axios.get(`http://${apiUrl}/player-ppt`, {
        params: { mode: "doubles", seasonId: selectedSeason ?? null },
      });

      const bwtSingles = await axios.get(
        `http://${apiUrl}/tournamentBestWorst`,
        { params: { mode: "singles", seasonId: selectedSeason ?? null } }
      );
      const bwtDoubles = await axios.get(
        `http://${apiUrl}/tournamentBestWorst`,
        { params: { mode: "doubles", seasonId: selectedSeason ?? null } }
      );

      const winPercSingles = await axios.get(
        `http://${apiUrl}/get-records?mode=${"singles"}&seasonId=${
          selectedSeason ?? ""
        }`
      );

      const winPercDoubles = await axios.get(
        `http://${apiUrl}/get-records-p?mode=${"doubles"}&seasonId=${
          selectedSeason ?? ""
        }`
      );

      const seasonProgress = await axios.get(
        `http://${apiUrl}/getSeasonProgress`
      );

      setSeasonProgress(seasonProgress.data);

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
      setPPTSinglesData(sortData(pptSingles.data) as any);
      setPPTDoublesData(sortData(pptDoubles.data) as any);
      setSinglesBWT(bwtSingles.data.playerBestWorst as any);
      setDoublesBWT(bwtDoubles.data.playerBestWorst as any);
      setWinSingles(winPercSingles.data as any);
      setWinDoubles(winPercDoubles.data as any);
    };

    fetchData();
  }, [selectedSeason]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>();

  const handlePlayerClick = (player: any) => {
    setSelectedPlayer(player);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setSelectedPlayer(null);
    setModalOpen(false);
  };

  const router = useRouter();

  const [playersS, playersD] = createPlayers(
    singlesGameData,
    singlesTournamentData,
    doublesGameData,
    doublesTournamentData,
    pptSinglesData,
    pptDoublesData,
    singlesBWT,
    doublesBWT,
    winSingles,
    winDoubles
  );

  const playersOPSS = playersS.map((player: Player) => ({
    name: player.name,
    score: calculateOPS(player),
  }));

  const playersOPSD = playersD.map((player: Player) => ({
    name: player.name,
    score: calculateOPS(player),
  }));

  const combinedPlayers = [...playersOPSS, ...playersOPSD];

  // Group the combined array by player name
  const groupedPlayers = combinedPlayers.reduce((acc, player) => {
    acc[player.name] = acc[player.name] || {
      name: player.name,
      count: 0,
      totalScore: 0,
    };
    acc[player.name].totalScore += player.score;
    acc[player.name].count++;
    return acc;
  }, {});

  // Calculate the average score for each player and handle missing players
  const averagedPlayers: any = Object.values(groupedPlayers).map(
    (player: any) => ({
      name: player.name,
      averageScore: player.totalScore / 2,
      playerSinglesScore:
        playersOPSS[getNameIndex(player.name, playersOPSS)]?.score,
      playerSingles: playersS[getNameIndex(player.name, playersS)],

      playerDoublesScore:
        playersOPSD[getNameIndex(player.name, playersOPSD)]?.score,
      playerDoubles: playersD[getNameIndex(player.name, playersD)],
    })
  );

  averagedPlayers.sort((a: any, b: any) =>
    (b.averageScore - a.averageScore).toFixed(3)
  );

  const MVPs = averagedPlayers.map((player: any) => ({
    name: player.name,
    MVP: calculateMVP(
      player,
      winSingles[getNameIndex(player.name, winSingles)],
      winDoubles[getNameIndex(player.name, winDoubles)]
    ),
  }));

  MVPs.sort((a: any, b: any) => (b.MVP - a.MVP).toFixed(3));

  return (
    <Container maxW="container.lg">
      <Center mb="20px">
        <Select
          placeholder="Select Season"
          onChange={(e) => {
            setSelectedSeason(e.target.value);
          }}
          maxW="md"
        >
          {Object.entries(seasons).map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </Select>
      </Center>
      <Center>
        <HStack spacing="50px">
          <HStack>
            <VStack spacing={8}>
              <Heading as="h1" mb={8} textAlign="center">
                All-NPA Teams
              </Heading>

              {averagedPlayers.map((player: any, index: any) => (
                <Box
                  key={index}
                  w="175px"
                  p={4}
                  _hover={{ cursor: "pointer" }}
                  bg={
                    index < 2
                      ? accoladeCategories[0].color
                      : index < 4
                      ? accoladeCategories[1].color
                      : index < 6
                      ? accoladeCategories[2].color
                      : accoladeCategories[3].color
                  }
                  borderRadius="md"
                  fontWeight={index < 6 ? "bold" : "normal"}
                  onClick={() =>
                    handlePlayerClick({
                      name: player.name,
                      singlesData: player.playerSingles,
                      singlesScore: player.playerSinglesScore,
                      doublesData: player.playerDoubles,
                      doublesScore: player.playerDoublesScore,
                      avgScore: player.averageScore,
                    })
                  }
                >
                  <Text>{player.name}</Text>
                  <Text>{player.averageScore.toFixed(3)}</Text>
                </Box>
              ))}
            </VStack>

            <VStack
              spacing={4}
              align="stretch"
              pos="absolute"
              left={10}
              top={10}
            >
              {accoladeCategories.map(({ name, color }) => (
                <Container key={name} bg={color} borderRadius="md" p={4}>
                  <Text color="white" fontWeight="bold">
                    {accoladeTexts[name]}
                  </Text>
                </Container>
              ))}
            </VStack>
          </HStack>
          <HStack>
            <VStack spacing={8}>
              <Heading as="h1" mb={8} textAlign="center">
                MVP
              </Heading>
              {MVPs.map((player: any, index: any) => (
                <Box
                  key={index}
                  w="175px"
                  p={4}
                  _hover={{ cursor: "disabled" }}
                  bg={
                    index < 1
                      ? MVPCategories[0].color
                      : index < 2
                      ? MVPCategories[1].color
                      : index < 3
                      ? MVPCategories[2].color
                      : accoladeCategories[3].color
                  }
                  borderRadius="md"
                  fontWeight={index < 6 ? "bold" : "normal"}
                >
                  <Text>{player.name}</Text>
                  <Text>{player.MVP.toFixed(3)}</Text>
                </Box>
              ))}
            </VStack>
            <VStack
              spacing={4}
              align="stretch"
              pos="absolute"
              right={10}
              top={10}
            >
              {MVPCategories.map(({ name, color }) => (
                <Container key={name} bg={color} borderRadius="md" p={4}>
                  <Text color="white" fontWeight="bold">
                    {MVPTexts[name]}
                  </Text>
                </Container>
              ))}
            </VStack>

            <VStack
              spacing={4}
              align="stretch"
              pos="absolute"
              top={350}
              left={10}
              bg="gray.700"
              padding="15px"
              borderRadius="lg"
            >
              <Heading fontSize="xl">Season Progress</Heading>
              <VStack spacing={7}>
                <Heading fontSize="lg">
                  Singles:{" "}
                  {(seasonProgress?.singlesCompletionPrevious * 100).toFixed(2)}
                  %,{" "}
                  {(seasonProgress?.singlesCompletionCurrent * 100).toFixed(2)}%
                </Heading>
                <DualProgressBar
                  percentage1={seasonProgress?.singlesCompletionPrevious * 100}
                  percentage2={seasonProgress?.singlesCompletionCurrent * 100}
                />
                <Heading fontSize="lg">
                  Doubles{" "}
                  {(seasonProgress?.doublesCompletionPrevious * 100).toFixed(2)}
                  %,{" "}
                  {(seasonProgress?.doublesCompletionCurrent * 100).toFixed(2)}%
                </Heading>
                <DualProgressBar
                  percentage1={seasonProgress?.doublesCompletionPrevious * 100}
                  percentage2={seasonProgress?.doublesCompletionCurrent * 100}
                />

                <VStack alignItems="start">
                  <HStack>
                    <Box
                      w="30px"
                      h="30px"
                      bg="green.400"
                      borderRadius="md"
                    ></Box>
                    <Text>Previous</Text>
                  </HStack>
                  <HStack>
                    <Box
                      w="30px"
                      h="30px"
                      bg="blue.400"
                      borderRadius="md"
                    ></Box>
                    <Text>After Next</Text>
                  </HStack>
                </VStack>
              </VStack>
            </VStack>
          </HStack>
        </HStack>
      </Center>
      <Modal isOpen={modalOpen} onClose={handleModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Player Score Calculation</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedPlayer && (
              <VStack align="stretch">
                <Text fontWeight="bold">Singles Selection Index</Text>
                <Text>
                  0.45 x {selectedPlayer.singlesData?.PPG} + 0.25 x{" "}
                  {selectedPlayer.singlesData?.PPS} + 0.175 x{" "}
                  {selectedPlayer.singlesData?.PPT} + 0.075 x{" "}
                  {selectedPlayer.singlesData?.BST} + 0.05 x{" "}
                  {selectedPlayer.singlesData?.WRST} ={" "}
                  <Text fontWeight="bold">
                    {selectedPlayer.singlesScore?.toFixed(3)}
                  </Text>
                </Text>
                <Text fontWeight="bold">Doubles Selection Index</Text>
                <Text>
                  0.45 x {selectedPlayer.doublesData?.PPG} + 0.25 x{" "}
                  {selectedPlayer.doublesData?.PPS} + 0.175 x{" "}
                  {selectedPlayer.doublesData?.PPT} + 0.075 x{" "}
                  {selectedPlayer.doublesData?.BST} + 0.05 x{" "}
                  {selectedPlayer.doublesData?.WRST} ={" "}
                  <Text fontWeight={"bold"}>
                    {selectedPlayer.doublesScore?.toFixed(3)}
                  </Text>
                </Text>

                <Text fontWeight="bold">Cumulative Selection Index</Text>
                <Text>
                  ({selectedPlayer.doublesScore?.toFixed(3)} +{" "}
                  {selectedPlayer.singlesScore?.toFixed(3)}) / 2 ={" "}
                  <Text fontWeight="bold">
                    {selectedPlayer.avgScore?.toFixed(3)}
                  </Text>
                </Text>

                <Text fontWeight="bold">MVP Selection Index</Text>
                <Text>
                  0.6 x {selectedPlayer.avgScore?.toFixed(3)} + 0.25 x{" "}
                  {scalePercentageToFive(selectedPlayer.singlesData?.PERC)} +
                  0.15 x{" "}
                  {scalePercentageToFive(selectedPlayer.doublesData?.PERC)} =
                  <Text fontWeight="bold">
                    {typeof selectedPlayer.singlesData?.PERC == "number"
                      ? (
                          0.6 * selectedPlayer.avgScore +
                          0.25 *
                            scalePercentageToFive(
                              selectedPlayer.singlesData?.PERC
                            ) +
                          0.15 *
                            scalePercentageToFive(
                              selectedPlayer.doublesData?.PERC
                            )
                        ).toFixed(3)
                      : 0}
                  </Text>
                </Text>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={handleModalClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default AccoladeTrackerPage;
