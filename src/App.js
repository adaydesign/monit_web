import { Button, ChakraProvider, CircularProgress, extendTheme, Flex, FormControl, FormLabel, Heading, HStack, Input, InputGroup, InputRightElement, Select, SimpleGrid, Spacer, Stack, StackDivider, Text, VStack } from "@chakra-ui/react"
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import { DeleteIcon } from '@chakra-ui/icons'
import groups from './group.json'

const GroupContext = createContext(1)
const FilterContext = createContext({ status: "all", size: "normal", name: "" })

const MonitorItem = ({ item }) => {
  const [filter] = useContext(FilterContext)
  return (
    <VStack spacing={2} bgColor={item.online ? "green.500" : "red.400"} p={filter.size === "normal" ? 4 : 2} borderRadius="lg" shadow="lg">
      <Text fontWeight="bold">{item.server}</Text>
      <Text fontSize="xs" color="white.300">{item.end_point}</Text>
      <Text fontSize="sm">{item.online}</Text>
    </VStack>
  )
}

const MonitorTable = () => {
  const [selectedGroup] = useContext(GroupContext)
  const [filter] = useContext(FilterContext)
  const [result, setResult] = useState({
    data: null,
    loading: false,
    error: null
  })
  const loadData = useRef()
  const targetGroup = useMemo(() => {
    return groups.find(i => i.id === selectedGroup)
  }, [selectedGroup])

  const displayItems = useMemo(() => {
    if (result.data) {
      const filterResult = result.data?.filter(i => {
        if (i.server.includes(filter.name)) {
          return (filter.status === "all" || (filter.status === "true" && i.online) || (filter.status === "false" && !i.online))
        }
        return false
      })
      return filterResult
    }
    return []
  }, [result.data, filter])

  loadData.current = async () => {
    if (selectedGroup > 0) {
      setResult({
        loading: true,
        error: null,
        data: null
      })
      try {
        const rs = await fetch(targetGroup?.url)
        const rsJson = await rs.json()
        setResult({
          loading: false,
          error: null,
          data: rsJson
        })
      } catch (err) {
        setResult({
          loading: false,
          error: err.toString(),
          data: null
        })
      }
    }
  }

  useEffect(() => {
    loadData.current()
  }, [selectedGroup])

  return (
    <Flex w="full" p={10} direction="column" mt={{ sm: "250px", lg: "50px" }}>
      {result.error && <ErrorMessage error={result.error} />}
      {result.loading && <LoadingMessage />}
      {
        displayItems && displayItems.length > 0 &&
        <SimpleGrid columns={filter.size === "normal" ? { sm: 2, lg: 4 } : { sm: 3, lg: 6 }} spacing={4} w="full">
          {displayItems?.map((i, index) => <MonitorItem item={i} key={`monit_item_${index}`} />)}
        </SimpleGrid>
      }
      {
        !result.loading && displayItems?.length === 0 &&
        <NoContentMessage />
      }
    </Flex>
  )
}

const MonitorMenu = ({ item }) => {
  const [selectedGroup, setSelectedGroup] = useContext(GroupContext)
  const isSelected = item.id === selectedGroup
  return (
    <Button variant={isSelected ? "solid" : "link"} onClick={() => setSelectedGroup(item.id)} colorScheme={isSelected ? 'white' : 'blue'}>{item.name}</Button>
  )
}

const MonitorMenuBar = () => {

  return (
    <Flex w="full" backgroundColor="blue.800" px={6} py={2} justify=""
      align="center" shadow="md" mb={2}
      position="fixed" top={0} zIndex={1}
      direction={{ sm: "column", lg: "row" }}>
      <Heading color="white" size="md">[M] o r n i t e r</Heading>
      <Spacer />
      <HStack spacing={4} divider={<StackDivider verticalAlign borderColor="blue.500" />}>
        {
          groups.map((i, index) => <MonitorMenu item={i} key={`menu_${index}`} />)
        }
      </HStack>
      <Spacer />
      <MonitorFilterBar />
    </Flex>
  )
}

const MonitorFilterBar = () => {
  const [filter, setFileter] = useContext(FilterContext)
  const setFilterHandler = (value) => {
    setFileter({ ...filter, ...value })
  }
  return (
    <Flex justify="center" mt={{ sm: 3, lg: 0 }}>
      <Stack spacing={2} w="full" direction={{ sm: "column", lg: "row" }}>
        <FormControl>
          <HStack >
            <FormLabel>Name</FormLabel>
            <InputGroup size="sm">
              <Input
                pr="4.5rem"
                type="text"
                value={filter?.name}
                onChange={(e) => setFilterHandler({ name: e.target.value })}
                placeholder="Search"
              />
              <InputRightElement width="4.5rem">
                <Button h="1.75rem" size="sm" onClick={() => setFilterHandler({ name: "" })} variant="ghost">
                  <DeleteIcon w={2} h={2} />
                </Button>
              </InputRightElement>
            </InputGroup>
          </HStack>
        </FormControl>
        <FormControl>
          <HStack>
            <FormLabel >Status</FormLabel>
            <Select size="sm" value={filter?.status} onChange={(e) => setFilterHandler({ status: e.target.value })}>
              <option value="all">All</option>
              <option value="true">Online</option>
              <option value="false">Offline</option>
            </Select>
          </HStack>
        </FormControl>
        <FormControl>
          <HStack>
            <FormLabel >Size</FormLabel>
            <Select size="sm" value={filter?.size} onChange={(e) => setFilterHandler({ size: e.target.value })}>
              <option value="normal">Normal</option>
              <option value="small">Small</option>
            </Select>
          </HStack>
        </FormControl>
      </Stack>
    </Flex>
  )
}

const LoadingMessage = () => {
  const [selectedGroup] = useContext(GroupContext)
  return (
    <Flex w="full" justify="center">
      <CircularProgress size="20px" mr={3} isIndeterminate color="blue.800" />
      <Text color="blue.800" fontWeight="bold" mb={6}>L O A D I N G ... (group {selectedGroup})</Text>
    </Flex>
  )
}

const NoContentMessage = () => {
  return (
    <Flex w="full" justify="center" bgColor="blue.50">
      <Text color="blue.800" fontWeight="bold" mb={6}>N O - D A T A</Text>
    </Flex>
  )
}

const ErrorMessage = ({ error }) => {
  const [selectedGroup] = useContext(GroupContext)
  return (
    <Flex w="full" align="center" direction="column">
      <Text color="red">{`Error: ${error} (group ${selectedGroup})`}</Text>
      <Text color="red">{`[url ${groups.find(i => i.id === selectedGroup)?.url}]`}</Text>
    </Flex>
  )
}



const App = () => {
  const [selectedGroup, setSelectedGroup] = useState(1)
  const [filter, setFilter] = useState({ status: "all", size: "normal", name: "" })
  const theme = extendTheme({
    fonts: {
      body: "'IBM Plex Sans Thai', sans-serif",
      heading: "'IBM Plex Sans Thai', sans-serif",
      mono: "'IBM Plex Sans Thai', sans-serif"
    }
  })

  return (
    <ChakraProvider theme={theme}>
      <GroupContext.Provider value={[selectedGroup, setSelectedGroup]}>
        <FilterContext.Provider value={[filter, setFilter]}>
          <Flex w="full" direction="column">
            <MonitorMenuBar />
            <MonitorTable />
          </Flex>
        </FilterContext.Provider>
      </GroupContext.Provider>
    </ChakraProvider>
  );
}

export default App;
