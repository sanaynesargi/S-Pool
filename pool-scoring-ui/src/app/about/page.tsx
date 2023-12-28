"use client";
import { ArrowBackIcon } from "@chakra-ui/icons";
import {
  Box,
  Container,
  Heading,
  Text,
  Link,
  VStack,
  Divider,
  Button,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";

const AboutPage = () => {
  const bgColor = "gray.700";
  const textColor = "whiteAlpha.900";

  const router = useRouter();

  return (
    <>
      <head>
        <title>About S-Pool</title>
      </head>
      <Container maxW="container.md" pt={5}>
        <Box bg={bgColor} p={5} borderRadius="lg" shadow="md">
          <VStack spacing={4} align="stretch">
            <Heading as="h1" color={textColor}>
              About S-Pool
            </Heading>
            <Divider />
            <Text color={textColor}>
              S-Pool is an innovative project for logging 8-ball pool games. It
              introduces a fantasy scoring system and stat calculations for
              in-depth performance analysis, coupled with a betting lines system
              for added excitement.
            </Text>
            <Text color={textColor}>
              The project is crafted with TypeScript, JavaScript, and SQLite,
              emphasizing a robust and user-friendly experience for pool
              enthusiasts. It aims to transform how players track, analyze, and
              enjoy their games.
            </Text>
            <Link
              href="https://github.com/sanaynesargi/S-Pool"
              isExternal
              color="blue.500"
            >
              Discover more on GitHub
            </Link>
          </VStack>
          <Button
            leftIcon={<ArrowBackIcon />}
            bg="blackAlpha.800"
            onClick={() => {
              router.push("/");
            }}
          >
            Back
          </Button>
        </Box>
      </Container>
    </>
  );
};

export default AboutPage;
