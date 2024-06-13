"use client";

import React, { useEffect } from "react";
import {
  Box,
  Button,
  Heading,
  VStack,
  Flex,
  Text,
  Container,
  HStack,
  Stat,
  StatArrow,
  StatGroup,
  StatHelpText,
  StatLabel,
  StatNumber,
  Center,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";

const HomePage: React.FC = () => {
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  useEffect(() => {
    localStorage.setItem("chakra-ui-color-mode", "dark");
  }, []);

  return (
    <Center h="100vh">
      <StatGroup>
        <HStack spacing="15vw">
          <Stat bg="gray.700" padding="15px" borderRadius="md">
            <StatLabel>Sent</StatLabel>
            <StatNumber>345,670</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              23.36%
            </StatHelpText>
          </Stat>

          <Stat bg="gray.700" padding="15px" borderRadius="md">
            <StatLabel>Clicked</StatLabel>
            <StatNumber>45</StatNumber>
            <StatHelpText>
              <StatArrow type="decrease" />
              9.05%
            </StatHelpText>
          </Stat>
        </HStack>
      </StatGroup>
    </Center>
  );
};

export default HomePage;
