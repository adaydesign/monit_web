import { Button, ChakraProvider, Flex } from "@chakra-ui/react"
import { createContext } from "@chakra-ui/react-utils"
import { useContext, useState } from "react"
import groups from './group.json'

const GroupContext = createContext(1)

const MonitorGroup = () => {
  return (<></>)
}

const MonitorMenu = (item) => {
  const [selectedGroup, setSelectedGroup] = useContext(GroupContext)
  return (
    <Button variant="link" onClick={() => setSelectedGroup(item.id)}>{item.name}</Button>
  )
}
const MonitorMenuBar = () => {
  return (
    <Flex w="full">
      {
        groups.map(i => <MonitorMenu item={i} />)
      }
    </Flex>
  )
}
const App = () => {
  const [selectedGroup, setSelectedGroup] = useState(1)

  return (
    <ChakraProvider>
      <GroupContext.Provider value={[selectedGroup, setSelectedGroup]}>
        <>
        </>
      </GroupContext.Provider>
    </ChakraProvider>
  );
}

export default App;
