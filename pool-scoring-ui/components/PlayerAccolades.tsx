import React from "react";
import { Box, Heading, Text, Badge, Divider } from "@chakra-ui/react";
import { useRef } from "react";
import { useEffect } from "react";

const PlayerAccolades = ({ playerTags, players }: any) => {
  const getFontSize = (category: string, award: string) => {
    if (category == "PPG") {
      if (award.includes("3+")) {
        return "9pt";
      } else if (award.includes("4+")) {
        return "11pt";
      } else if (award.includes("5+")) {
        return "13pt";
      } else if (award.includes("6+")) {
        return "15pt";
      } else if (award.includes("7+")) {
        return "17pt";
      }
    } else if (category == "PPT") {
      if (award.includes("10+")) {
        return "9pt";
      } else if (award.includes("12+")) {
        return "11pt";
      } else if (award.includes("15+")) {
        return "13pt";
      } else if (award.includes("17+")) {
        return "15pt";
      } else if (award.includes("20+")) {
        return "17pt";
      } else if (award.includes("25+")) {
        return "19pt";
      } else if (award.includes("40+")) {
        return "21pt";
      }
    } else {
      if (award.includes("0.2+")) {
        return "9pt";
      } else if (award.includes("0.35+")) {
        return "11pt";
      } else if (award.includes("0.5+")) {
        return "13pt";
      } else if (award.includes("0.75+")) {
        return "15pt";
      }
    }
  };

  const groupAwards = (tags: any) => {
    const groupedAwards: any = {};
    tags.forEach((tag: any) => {
      const category = tag.split(" ")[1]; // Extract category (PPG, PPT, PPS)
      if (!groupedAwards[category]) {
        groupedAwards[category] = [];
      }
      groupedAwards[category].push(tag);
    });
    return groupedAwards;
  };

  return (
    <Box>
      {Object.entries(playerTags).map(([player, tags], index) => {
        if (!players.includes(player)) {
          return;
        }

        const groupedAwards = groupAwards(tags);
        return (
          <Box
            key={player}
            mb={6}
            p={4}
            borderWidth="1px"
            borderRadius="lg"
            boxShadow="lg"
          >
            <Heading as="h2" size="md" mb={2}>
              {player}'s Accolades
            </Heading>
            <Divider mb={4} />
            {Object.entries(groupedAwards).map(([category, awards]: any) => (
              <Box key={category} mb={2}>
                <Text fontWeight="bold" mb={2}>
                  {category}
                </Text>
                <Box>
                  {awards.map((award: any, idx: any) => (
                    <Badge
                      key={idx}
                      mr={2}
                      mb={2}
                      variant="solid"
                      colorScheme={
                        category === "PPS"
                          ? "yellow"
                          : category === "PPG"
                          ? "green"
                          : category === "PPT"
                          ? "blue"
                          : "gray"
                      }
                      fontSize={getFontSize(category, award)}
                    >
                      {award}
                    </Badge>
                  ))}
                </Box>
              </Box>
            ))}
            <Text mt={4} fontSize="sm" color="gray.500">
              Disclaimer: These accolades are for completed seasons only.
            </Text>
            {index !== Object.keys(playerTags).length - 1 && <Divider mt={4} />}
          </Box>
        );
      })}
    </Box>
  );
};

export default PlayerAccolades;
