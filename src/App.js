import {
  Button, ChakraProvider, CircularProgress, Collapse, extendTheme, Flex, FormControl, Heading, HStack, Input,
  InputGroup, InputRightElement, Select, SimpleGrid, SlideFade, Spacer, Stack, StackDivider, Text, VStack
} from "@chakra-ui/react"
import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react"
import { DeleteIcon } from '@chakra-ui/icons'
import GroupContext, { defaultValues, groupReducer, setData, setError, setLoading, setSelected } from "./groupContext"

const FilterContext = createContext({ status: "all", size: "normal", name: "", time: 3000 })

/*
item {
  name: "",
  url: "" (10.1.2.111:3000)
}
*/
const MonitorItem = ({ item }) => {
  const [filter] = useContext(FilterContext)
  const [status, setStatus] = useState(0)

  const bgColor = useMemo(() => {
    switch (status) {
      case 1: return "green.500" // online
      case 2: return "red.500" // offline
      default: return "gray.500"
    }
  }, [status])

  const collapseIn = useMemo(() => {
    //name
    if (!item.name.includes(filter.name)) {
      return false
    }
    //status : all 0(connecting) 1(online) 2(offline)
    if (filter.status !== "all" && status !== parseInt(filter.status)) {
      return false
    }
    return true
  }, [filter, status, item])

  const loadData = useRef()
  loadData.current = async () => {
    setStatus(0)
    try {
      const url = `${process.env.REACT_APP_API}/ping/${item.url}`
      const rs = await fetch(url)
      if (rs.ok) {
        const rsJson = await rs.json()
        if (rsJson.data) {
          setStatus(1) // online
        }
      } else {
        setStatus(2) // offline 
      }

    } catch (err) {
      setStatus(2) // offline
    }
  }

  useEffect(() => {
    loadData.current()
  }, [item])

  const interval = useRef()
  useEffect(() => {
    clearInterval(interval.current)

    interval.current = setInterval(() => {
      // console.log(`refresh with : ${filter.time}`)
      loadData.current()
    }, filter.time);
    return () => clearInterval(interval.current);
  }, [filter.time]);

  return (
    collapseIn ?
      <SlideFade in={true} offsetY="20px">
        <Collapse in={collapseIn}>
          <VStack spacing={2} bgColor={bgColor} p={filter.size === "normal" ? 4 : 2} borderRadius="lg" shadow="lg" onClick={() => { loadData.current() }} cursor="pointer">
            <Text fontWeight="bold">{item.name}</Text>
            <HStack>
              {status === 0 && <CircularProgress size="20px" isIndeterminate />}
              <Text fontSize="xs" color="white.300">{item.url}</Text>
            </HStack>
          </VStack>
        </Collapse>
      </SlideFade>
      : (null)
  )
}

const MonitorTable = () => {
  const [groups] = useContext(GroupContext)
  const [filter] = useContext(FilterContext)
  const targetGroup = useMemo(() => {
    if (groups?.data) {
      return groups?.data?.find(i => i.id === groups?.selected)
    } else {
      return []
    }
  }, [groups])

  const displayItems = useMemo(() => {
    if (targetGroup) {
      return targetGroup?.servers
    }
    return []
  }, [targetGroup])

  return (
    <Flex w="full" p={10} direction="column" mt={{ sm: "200px", lg: "100px" }}>
      {groups.error && <ErrorMessage error={groups.error} />}
      {groups.loading && <LoadingMessage />}
      {
        displayItems && displayItems.length > 0 &&
        <SimpleGrid columns={filter.size === "normal" ? { sm: 2, lg: 4 } : { sm: 3, lg: 6 }} spacing={4} w="full">
          {displayItems?.map((i, index) => <MonitorItem item={i} key={`monit_item_${index}`} />)}
        </SimpleGrid>
      }
      {
        !groups.loading && displayItems?.length === 0 &&
        <NoContentMessage />
      }
    </Flex>
  )


}

const MonitorMenu = ({ item }) => {
  const [groups, dispatchGroups] = useContext(GroupContext)
  const isSelected = useMemo(() => {
    return item.id === groups?.selected
  }, [item, groups?.selected])
  return (
    <Button variant={isSelected ? "solid" : "link"} onClick={() => dispatchGroups(setSelected(item.id))} colorScheme={isSelected ? 'white' : 'blue'}>{item.name}</Button>
  )
}

// load list of servers
const MonitorMenuBar = () => {
  const [groups, dispatchGroups] = useContext(GroupContext)
  const loadData = useRef()
  loadData.current = async () => {
    try {
      dispatchGroups(setLoading(true))
      const url = `${process.env.REACT_APP_API}/servers`
      const rs = await fetch(url)
      const rsJson = await rs.json()
      if (rsJson) {
        dispatchGroups(setData(rsJson))
      } else {
        dispatchGroups(setLoading(false))
      }
    } catch (err) {
      dispatchGroups(setError(err.toString()))
    }
  }

  useEffect(() => {
    loadData.current()
  }, [])

  return (
    <Flex w="full" bgGradient="linear(#1A365D,#FF0080)" px={6} py={2}
      align="center" shadow="md" mb={2}
      position="fixed" top={0} zIndex={1}
      direction="column">
      <Flex w="full" align="center" mb={1}>
        <Heading color="white" size="md">{process.env.REACT_APP_NAME}</Heading>
        <Spacer />
        {groups?.loading && <CircularProgress size="20px" mr={3} isIndeterminate color="blue.800" />}
        {groups?.error && <Text color="white">{groups?.error}</Text>}
        {groups?.data &&
          <HStack spacing={4} divider={<StackDivider verticalAlign borderColor="blue.500" />}>
            {
              groups?.data.map((i, index) => <MonitorMenu item={i} key={`menu_${index}`} />)
            }
          </HStack>
        }
        <Spacer />
      </Flex>
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
    <Flex w="full" justify="center" mt={{ sm: 3, lg: 0 }} bgColor="whiteAlpha.300" p={3} borderRadius="md">
      <Stack spacing={2} w="full" direction={{ sm: "column", lg: "row" }}>
        <FormControl>
          <HStack align="center">
            <Text>Name</Text>
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
          <HStack align="center">
            <Text >Status</Text>
            <Select size="sm" value={filter?.status} onChange={(e) => setFilterHandler({ status: e.target.value })}>
              <option value="all">All</option>
              <option value="0">Connecting...</option>
              <option value="1">Online</option>
              <option value="2">Offline</option>
            </Select>
          </HStack>
        </FormControl>
        <FormControl>
          <HStack align="center">
            <Text >Size</Text>
            <Select size="sm" value={filter?.size} onChange={(e) => setFilterHandler({ size: e.target.value })}>
              <option value="normal">Normal</option>
              <option value="small">Small</option>
            </Select>
          </HStack>
        </FormControl>
        <FormControl>
          <HStack align="center">
            <Text >Refresh</Text>
            <Select size="sm" value={filter?.time} onChange={(e) => setFilterHandler({ time: e.target.value })}>
              <option value={15000}>15 sec</option>
              <option value={30000}>30 sec</option>
              <option value={60000}>1 min</option>
              <option value={300000}>5 min</option>
              <option value={900000}>15 min</option>
              <option value={1800000}>30 min</option>
            </Select>
          </HStack>
        </FormControl>
      </Stack>
    </Flex>
  )
}

const LoadingMessage = () => {
  return (
    <Flex w="full" justify="center">
      <CircularProgress size="20px" mr={3} isIndeterminate color="blue.800" />
      <Text color="blue.800" fontWeight="bold" mb={6}>L O A D I N G ...</Text>
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
  return (
    <Flex w="full" align="center" direction="column">
      <Text color="red">{`Error: ${error} (-)`}</Text>
    </Flex>
  )
}



const App = () => {
  const [groups, dispatchGroups] = useReducer(groupReducer, defaultValues)
  const [filter, setFilter] = useState({ status: "all", size: "normal", name: "", time: 30000 })
  const theme = extendTheme({
    fonts: {
      body: "'IBM Plex Sans Thai', sans-serif",
      heading: "'IBM Plex Sans Thai', sans-serif",
      mono: "'IBM Plex Sans Thai', sans-serif"
    }
  })

  return (
    <ChakraProvider theme={theme}>
      <GroupContext.Provider value={[groups, dispatchGroups]}>
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
