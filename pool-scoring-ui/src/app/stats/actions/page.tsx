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
  Center,
  Divider,
  HStack,
  Heading,
  Radio,
  RadioGroup,
  SimpleGrid,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";

const formatData = (data: any) => {
  const names = Object.keys(data);
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

  const [mode, setMode] = useState(false);
  const [type, setType] = useState(false);
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

  useEffect(() => {
    Promise.all([
      axios.get(`http://localhost:8000/player-actions-stats?mode=singles`),
      axios.get(`http://localhost:8000/player-actions-stats?mode=doubles`),
      axios.get(
        `http://localhost:8000/player-actions-stats-averages?mode=singles`
      ),
      axios.get(
        `http://localhost:8000/player-actions-stats-averages?mode=doubles`
      ),
    ]).then((results) => {
      setDataSingles(formatData(results[0].data));
      setDataDoubles(formatData(results[1].data));
      setDataSinglesA(formatData(results[2].data));
      setDataDoublesA(formatData(results[3].data));
    });
  }, []);

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
                <RadioGroup
                  defaultValue="1"
                  onChange={() => {
                    setType(!type);
                    forceUpdate();
                  }}
                >
                  <Stack spacing={5} direction="row">
                    <Radio colorScheme="red" value="1">
                      Totals
                    </Radio>
                    <Radio colorScheme="green" value="2">
                      Averages
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
                        ? type
                          ? dataSinglesA![stat]
                          : dataSingles![stat]
                        : type
                        ? dataDoublesA![stat]
                        : dataDoubles![stat]
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
