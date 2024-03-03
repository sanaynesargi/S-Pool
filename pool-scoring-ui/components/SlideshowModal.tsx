import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  HStack,
  Heading,
  VStack,
  Text,
} from "@chakra-ui/react";
import CondensedAccolates from "./CondensedAccolades";
import PlayerAccolades from "./PlayerAccolades";
import axios from "axios";
import { apiUrl } from "../utils/utils";
import { useRef } from "react";
import AllStars from "./AllStars";

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

const SlideshowModal = ({
  mode,
  players,
  isGameStarted,
}: {
  mode: string;
  players: string[];
  isGameStarted: any;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tags, setTags] = useState<any>({});
  const [seasonProgress, setSeasonProgress] = useState<any>({});
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const components = [
    () => (
      <div>
        <CondensedAccolates />
      </div>
    ),
    () => (
      <div>
        <PlayerAccolades playerTags={tags} players={players} />
      </div>
    ),
    () => (
      <div>
        <VStack
          spacing={4}
          align="stretch"
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
              %, {(seasonProgress?.singlesCompletionCurrent * 100).toFixed(2)}%
            </Heading>
            <DualProgressBar
              percentage1={seasonProgress?.singlesCompletionPrevious * 100}
              percentage2={seasonProgress?.singlesCompletionCurrent * 100}
            />
            <Heading fontSize="lg">
              Doubles{" "}
              {(seasonProgress?.doublesCompletionPrevious * 100).toFixed(2)}
              %, {(seasonProgress?.doublesCompletionCurrent * 100).toFixed(2)}%
            </Heading>
            <DualProgressBar
              percentage1={seasonProgress?.doublesCompletionPrevious * 100}
              percentage2={seasonProgress?.doublesCompletionCurrent * 100}
            />

            <VStack alignItems="start">
              <HStack>
                <Box w="30px" h="30px" bg="green.400" borderRadius="md"></Box>
                <Text>Previous</Text>
              </HStack>
              <HStack>
                <Box w="30px" h="30px" bg="blue.400" borderRadius="md"></Box>
                <Text>After Next</Text>
              </HStack>
            </VStack>
          </VStack>
        </VStack>
      </div>
    ),

    () => <AllStars />,
  ];

  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(true);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  };

  const nextComponent = () => {
    containerRef.current.scrollTop = 0;
    if (currentIndex === components.length - 1) {
      closeModal();
      return;
    }
    setCurrentIndex((prevIndex) => (prevIndex + 1) % components.length);
  };

  const prevComponent = () => {
    containerRef.current.scrollTop = 0;
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + components.length) % components.length
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      const tags = await axios.get(`http://${apiUrl}/getTags`, {
        params: { mode },
      });

      setTags(tags.data.playerTags);

      const seasonProgress = await axios.get(
        `http://${apiUrl}/getSeasonProgress`
      );

      setSeasonProgress(seasonProgress.data);
    };

    fetchData();
  }, []);

  useEffect(() => {
    const scrollInterval = setInterval(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop += 2; // Adjust the scrolling speed as needed
        if (
          containerRef.current.scrollHeight - containerRef.current.scrollTop ===
          containerRef.current.clientHeight
        ) {
          // If the list reaches the bottom, reset the scroll position to the top
        }

        if (
          containerRef.current.scrollHeight - containerRef.current.scrollTop ===
            containerRef.current.clientHeight &&
          containerRef.current.scrollTop !== 0
        ) {
          nextComponent();
        }
      }
    }, 50); // Adjust the scroll interval as needed

    return () => clearInterval(scrollInterval);
  }, []);

  const playAudio = (audioUrl: string) => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    const newAudio = new Audio(audioUrl);
    setAudio(newAudio);
    newAudio.play();
  };

  const containerRef = useRef<any>(null);

  useEffect(() => {
    if (isGameStarted && !isOpen) {
      playAudio("https://www.soundboard.com/track/download/432489");
    }
  }, [isGameStarted, isOpen]);

  return (
    <>
      {/* <Button onClick={openModal}>Open Slideshow</Button> */}
      <Modal isOpen={isGameStarted && !isOpen} onClose={closeModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Slideshow</ModalHeader>
          <ModalCloseButton />
          <ModalBody maxH="500px" overflowY="scroll" ref={containerRef}>
            <Box>{components[currentIndex]()}</Box>
          </ModalBody>
          <Box textAlign="center" pb={4}>
            <Button mr={2} onClick={prevComponent}>
              Previous
            </Button>

            <Button onClick={nextComponent}>Next</Button>
          </Box>
        </ModalContent>
      </Modal>
    </>
  );
};

export default SlideshowModal;
