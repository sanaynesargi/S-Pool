"use client";

import axios from "axios";
import { useEffect, useReducer, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Box,
  Button,
  Center,
  Divider,
  HStack,
  Heading,
  Radio,
  RadioGroup,
  Select,
  SimpleGrid,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { apiUrl } from "../../../../utils/utils";
import { ArrowBackIcon } from "@chakra-ui/icons";
import router, { useRouter } from "next/navigation";

const formatData = (data: any) => {
  const names = Object.keys(data);

  if (names.length == 0) {
    return {};
  }

  const statBlob = data[names[0]];
  let statNames = [];

  let formattedDataset: any = {};

  for (const elem of statBlob) {
    statNames.push(elem.actionType);
  }

  for (let name of names) {
    for (let elem of data[name]) {
      if (!formattedDataset[elem.actionType]) {
        formattedDataset[elem.actionType] = [
          {
            name,
            count: parseFloat(
              (elem.totalActionCount ?? elem.averageActionCount).toFixed(2)
            ),
            // value: elem.totalActionValue,
          },
        ];
      } else {
        formattedDataset[elem.actionType].push({
          name,
          count: parseFloat(
            (elem.totalActionCount ?? elem.averageActionCount).toFixed(2)
          ),
          //   value: elem.totalActionValue,
        });
      }
    }
  }

  return formattedDataset;
};

const ActionsPage = () => {
  const [dataSingles, setDataSingles] = useState(null);
  const [dataDoubles, setDataDoubles] = useState(null);
  const [dataSinglesA, setDataSinglesA] = useState(null);
  const [dataDoublesA, setDataDoublesA] = useState(null);
  const [dataSinglesAT, setDataSinglesAT] = useState(null);
  const [dataDoublesAT, setDataDoublesAT] = useState(null);

  const [mode, setMode] = useState(false);
  const [type, setType] = useState(0);
  const [, forceUpdate] = useReducer((x: any) => x + 1, 0);

  const colors = [
    "#DC143C", // Crimson Red
    "#7DF9FF", // Electric Blue
    "#FFFF00", // Bright Yellow
    "#32CD32", // Lime Green
    "#FF69B4", // Hot Pink
    "#FFA500", // Vivid Orange
    "#E6E6FA", // Lavender
    "#40E0D0", // Turquoise
    "#39FF14", // Neon Green
  ];

  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState<any>();

  useEffect(() => {
    // Fetch the list of seasons
    axios
      .get(`${apiUrl}/getSeasons`)
      .then((response) => {
        setSeasons(response.data);
      })
      .catch((error) => console.error("Error fetching seasons:", error));
  }, []);

  useEffect(() => {
    Promise.all([
      axios.get(
        `${apiUrl}/player-actions-stats?mode=singles&seasonId=${
          selectedSeason ?? ""
        }`
      ),
      axios.get(
        `${apiUrl}/player-actions-stats?mode=doubles&seasonId=${
          selectedSeason ?? ""
        }`
      ),
      axios.get(
        `${apiUrl}/player-actions-stats-averages?mode=singles&seasonId=${
          selectedSeason ?? ""
        }`
      ),
      axios.get(
        `${apiUrl}/player-actions-stats-averages?mode=doubles&seasonId=${
          selectedSeason ?? ""
        }`
      ),
      axios.get(
        `${apiUrl}/player-actions-stats-average-tournaments?mode=singles&seasonId=${
          selectedSeason ?? ""
        }`
      ),
      axios.get(
        `${apiUrl}/player-actions-stats-average-tournaments?mode=doubles&seasonId=${
          selectedSeason ?? ""
        }`
      ),
    ]).then((results) => {
      setDataSingles(formatData(results[0].data));
      setDataDoubles(formatData(results[1].data));
      setDataSinglesA(formatData(results[2].data));
      setDataDoublesA(formatData(results[3].data));
      setDataSinglesAT(formatData(results[4].data));
      setDataDoublesAT(formatData(results[5].data));
    });
  }, [selectedSeason]);

  const router = useRouter();

  return (
    <>
      {!dataSingles || !dataDoubles ? (
        <Text color="white">Data Unavailable</Text>
      ) : (
        <>
          <Center>
            <VStack>
              <VStack>
                <Heading p={4}>Action Graphs</Heading>
                <Select
                  placeholder="Select Season"
                  onChange={(e) => setSelectedSeason(e.target.value)}
                >
                  {seasons
                    ? Object.keys(seasons).map((season: any) => (
                        <option key={season} value={season}>
                          {seasons[season]}
                        </option>
                      ))
                    : null}
                </Select>
                <RadioGroup
                  defaultValue="0"
                  onChange={(value) => {
                    setType(parseInt(value));
                    forceUpdate();
                  }}
                >
                  <Stack spacing={5} direction="row">
                    <Radio colorScheme="red" value="0">
                      Totals
                    </Radio>
                    <Radio colorScheme="green" value="1">
                      Averages Per Game
                    </Radio>
                    <Radio colorScheme="green" value="2">
                      Averages Per Tournament
                    </Radio>
                  </Stack>
                </RadioGroup>
                <RadioGroup
                  defaultValue="1"
                  onChange={() => {
                    setMode(!mode);
                    forceUpdate();
                  }}
                >
                  <Stack spacing={5} direction="row">
                    <Button
                      leftIcon={<ArrowBackIcon />}
                      bg="blackAlpha.800"
                      onClick={() => {
                        router.push("/");
                      }}
                    >
                      Back
                    </Button>
                    <Radio colorScheme="red" value="1">
                      Singles
                    </Radio>
                    <Radio colorScheme="green" value="2">
                      Doubles
                    </Radio>
                  </Stack>
                </RadioGroup>
              </VStack>
              <Divider w="90vw" />
            </VStack>
          </Center>
          <SimpleGrid columns={3} spacingX="40px" spacingY="20px">
            {Object.keys(dataSingles).map((stat, index) => (
              <Box key={index} p={1}>
                <Center>
                  <Text fontWeight="bold">{stat}</Text>
                </Center>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={
                      !mode
                        ? type == 0
                          ? dataSingles![stat]
                          : type == 1
                          ? dataSinglesA![stat]
                          : dataSinglesAT![stat]
                        : type == 0
                        ? dataDoubles![stat]
                        : type == 1
                        ? dataDoublesA![stat]
                        : dataDoublesAT![stat]
                    }
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#000",
                        borderColor: "black",
                        borderRadius: "md",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill={colors[index]}
                      radius={[10, 10, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            ))}
          </SimpleGrid>
        </>
      )}
    </>
  );
};

export default ActionsPage;
