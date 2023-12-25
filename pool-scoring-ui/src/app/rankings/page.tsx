"use client";

import {
  Box,
  Heading,
  List,
  ListItem,
  Container,
  VStack,
  Text,
  Badge,
  useColorModeValue,
  ScaleFade,
  Select,
  HStack,
  Button,
  Spacer,
  Center,
} from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
  Label,
} from "recharts";
import { apiUrl } from "../../../utils/utils";
import { useRouter } from "next/navigation";
import { ArrowBackIcon } from "@chakra-ui/icons";

const ScatterPlotComponent = ({ dictX, dictY }: any) => {
  // Convert the dictionaries into an array of objects suitable for plotting
  const data = dictX.map((obj: any, index: number) => {
    return {
      name: obj.name,
      x: parseFloat(obj.number), // Convert string to float
      y: parseFloat(dictY[index] ? dictY[index].number : 0), // Convert string to float
    };
  });

  return (
    <ScatterChart
      width={500}
      height={500}
      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
    >
      {/* <CartesianGrid /> */}
      <XAxis type="number" dataKey="x" name="PPG">
        <Label value="Points Per Game" offset={-20} position="insideBottom" />
      </XAxis>
      <YAxis type="number" dataKey="y" name="PPT">
        <Label
          value="Points Per Tournament"
          angle={-90}
          position="outside"
          offset={20}
        />
      </YAxis>
      <Tooltip cursor={{ strokeDasharray: "3 3" }} />
      <Scatter name="Values" data={data} fill="#8884d8">
        <LabelList dataKey="name" position="top" />
      </Scatter>
    </ScatterChart>
  );
};

const getListItemStyle = (index: any) => {
  switch (index) {
    case 0:
      return { fontSize: "lg", padding: "7", boxShadow: "2xl" };
    case 1:
      return { fontSize: "md", padding: "6", boxShadow: "xl" };
    case 2:
      return { fontSize: "sm", padding: "5", boxShadow: "lg" };
    default:
      return { fontSize: "sm", padding: "3", boxShadow: "md" };
  }
};

const getListItemBg = (index: any, column: any) => {
  const colorPalettes = [
    ["red.400", "orange.400", "yellow.500"], // Palette for 1st Row
    ["green.300", "cyan.400", "teal.400"], // Palette for 2nd Row
    ["blue.800", "purple.700", "green.700"], // Palette for 2nd Row
    ["green.300", "cyan.400", "teal.400"], // Palette for 3rd Row
    ["red.400", "orange.400", "yellow.500"], // Palette for 4th Row
    ["blue.800", "purple.700", "green.700"],
  ];

  if (index < 3) {
    return colorPalettes[column][index]; // Top 3 ranks
  }
  return "gray.600"; // Other ranks
};

const getDictXDictY = (inp: string) => {};

const RankingsPage = () => {
  const bgColor = useColorModeValue("gray.700", "gray.800");
  const textColor = useColorModeValue("gray.100", "whiteAlpha.900");
  const badgeColor = "gray.900";

  const [singlesGameData, setSinglesGameData] = useState([]);
  const [doublesGameData, setDoublesGameData] = useState([]);
  const [singlesTournamentData, setSinglesTournamentGameData] = useState([]);
  const [doublesTournamentData, setDoublesTournamentGameData] = useState([]);
  const [singlesStrokeData, setSinglesStrokeGameData] = useState([]);
  const [doublesStrokeData, setDoublesStrokeGameData] = useState([]);
  const [mode, setMode] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const gamesResS = await axios.get(
        `http://${apiUrl}/average-points-per-tournament-game`,
        { params: { mode: "singles" } }
      );

      const gamesResD = await axios.get(
        `http://${apiUrl}/average-points-per-tournament-game`,
        { params: { mode: "doubles" } }
      );

      const tournamentsResS = await axios.get(
        `http://${apiUrl}/average-points-per-game`,
        { params: { mode: "singles" } }
      );

      const tournamentsResD = await axios.get(
        `http://${apiUrl}/average-points-per-game`,
        { params: { mode: "doubles" } }
      );

      const pptSingles = await axios.get(
        `http://${apiUrl}/player-ppt?mode=singles`
      );
      const pptDoubles = await axios.get(
        `http://${apiUrl}/player-ppt?mode=doubles`
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

  const router = useRouter();

  return (
    <Container maxW="container.xl" py={5}>
      <VStack spacing={5}>
        <Center>
          <Heading color={textColor} mb={10}>
            <Spacer w="50px"></Spacer>
            {mode ? "GOAT Rankings" : "GOAT Ranking Graphs"}
          </Heading>
        </Center>
        {Object.keys(singlesGameData).length > 0 ? (
          <Box display="flex" justifyContent="space-around" width="100%">
            {[
              "Singles PPG",
              "Singles PPT",
              "Singles PPS",
              "Doubles PPG",
              "Doubles PPT",
              "Doubles PPS",
            ].map((category, columnIndex) => (
              <VStack key={category} spacing={4}>
                {mode ? (
                  <>
                    <Heading size="md" color={textColor}>
                      {category}
                    </Heading>
                    <List spacing={3}>
                      {[
                        singlesGameData,
                        singlesTournamentData,
                        singlesStrokeData,
                        doublesGameData,
                        doublesTournamentData,
                        doublesStrokeData,
                      ][columnIndex].map((team: any, index) => {
                        const { fontSize, padding, boxShadow } =
                          getListItemStyle(index);
                        return (
                          <ScaleFade key={index} initialScale={0.9} in={true}>
                            <ListItem
                              p={padding}
                              boxShadow={boxShadow}
                              borderRadius="lg"
                              bg={getListItemBg(index, columnIndex)}
                              _hover={{ transform: "scale(1.05)" }}
                              transition="all 0.2s ease-in-out"
                            >
                              <Text
                                fontSize={fontSize}
                                fontWeight="bold"
                                color={textColor}
                              >
                                {`${index + 1}. ${team.name}`}
                                <Badge ml={3} bg={badgeColor} borderRadius="5%">
                                  {team.number}
                                </Badge>
                              </Text>
                            </ListItem>
                          </ScaleFade>
                        );
                      })}
                    </List>
                  </>
                ) : null}
              </VStack>
            ))}
            {!mode ? (
              <HStack justifyContent="space-around" w="100%">
                <VStack>
                  <Heading size="md">Singles</Heading>
                  <ScatterPlotComponent
                    dictX={singlesGameData}
                    dictY={singlesTournamentData}
                  />
                </VStack>
                <VStack>
                  <Heading size="md">Doubles</Heading>
                  <ScatterPlotComponent
                    dictX={doublesGameData}
                    dictY={doublesTournamentData}
                  />
                </VStack>
              </HStack>
            ) : null}
          </Box>
        ) : null}
        <HStack>
          <Button
            leftIcon={<ArrowBackIcon />}
            bg="blackAlpha.800"
            onClick={() => {
              router.push("/");
            }}
          >
            Back
          </Button>
          <Select maxW="200px" onChange={() => setMode(!mode)}>
            <option>Rankings</option>
            <option>Graphs</option>
          </Select>
        </HStack>
      </VStack>
    </Container>
  );
};

export default RankingsPage;
