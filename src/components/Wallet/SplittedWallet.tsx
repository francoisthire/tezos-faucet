import { BeaconWallet } from "@taquito/beacon-wallet"
import { TezosToolkit } from "@taquito/taquito"
import { validateKeyHash } from "@taquito/utils"
import Config from "../../Config"
import { useEffect, useState, ChangeEvent } from "react"
import { Button, Card, Row, Col, Form } from "react-bootstrap"
import UserInfo from "../Faucet/UserInfo"
import { Network, TestnetContext, UserContext } from "../../lib/Types"

function SplittedWallet({
  user,
  testnetContext,
  network,
}: {
  user: UserContext
  testnetContext: TestnetContext
  network: Network
}) {
  const [inputClass, setInputClass] = useState<string>("")
  const [inputValue, setInputValue] = useState<string>("")

  /**
   * Set user address and balances on wallet connection
   */
  const setup = async (userAddress: string): Promise<void> => {
    user.setUserAddress(userAddress)

    const balance = await testnetContext.Tezos.tz.getBalance(userAddress)
    user.setUserBalance(balance.toNumber())
  }

  // Beacon wallet connection - hidden for now to avoid compatibility issues
  const _connectWallet = async (): Promise<void> => {
    if (!network.networkType) {
      console.error("No network defined.")
      return
    }

    try {
      await testnetContext.wallet.requestPermissions()
      // gets user's address
      const userAddress = await testnetContext.wallet.getPKH()
      await setup(userAddress)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    ; (async () => {
      // creates a wallet instance
      const wallet = new BeaconWallet({
        name: Config.application.name,
        network: {
          type: network.networkType!,
          rpcUrl: network.rpcUrl,
        },
        disableDefaultEvents: false,
      })
      testnetContext.Tezos.setWalletProvider(wallet)
      testnetContext.setWallet(wallet)
      // checks if wallet was connected before
      const activeAccount = await wallet.client.getActiveAccount()
      if (activeAccount) {
        const userAddress = await wallet.getPKH()
        await setup(userAddress)
      }
    })()
  }, [])

  const disconnectWallet = async (): Promise<void> => {
    user.setUserAddress("")
    user.setUserBalance(0)
    setInputValue("")
    setInputClass("")
    const tezosTK = new TezosToolkit(network.rpcUrl)
    testnetContext.setTezos(tezosTK)
    if (testnetContext.wallet) {
      await testnetContext.wallet.clearActiveAccount()
    }
  }

  const handleInput = async (event: ChangeEvent<HTMLInputElement>) => {
    const value: string = event.target.value
    setInputValue(value)

    if (value.length === 0) {
      setInputClass("")
      user.setUserAddress("")
      user.setUserBalance(0)
    } else if (validateKeyHash(value) === 3) {
      setInputClass("is-valid")
      await setup(value)
    } else {
      setInputClass("is-invalid")
      user.setUserAddress("")
      user.setUserBalance(0)
    }
  }

  return (
    <Card>
      <Card.Header>My wallet</Card.Header>
      <Card.Body>
        {user.userAddress ? (
          <Row className="d-flex gy-2 flex-wrap align-items-center">
            <Col>
              <UserInfo user={user} displayBalance={false} />
            </Col>

            <Col>
              <Button variant="outline-danger" onClick={disconnectWallet}>
                Clear
              </Button>
            </Col>
          </Row>
        ) : (
          <Form.Group>
            <Form.Control
              type="text"
              placeholder="Paste your address (tz1...)"
              className={inputClass}
              value={inputValue}
              onChange={handleInput}
            />
            <Form.Control.Feedback type="invalid" className="position-absolute">
              Invalid address
            </Form.Control.Feedback>
          </Form.Group>
        )}
      </Card.Body>
    </Card>
  )
}

export default SplittedWallet
