"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Html5QrcodeScanner } from "html5-qrcode"
import Navbar from "../../components/layout/Navbar"

const ScanQR = () => {
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState(null)
  const [manualCode, setManualCode] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    let scanner = null

    if (scanning) {
      // Create a unique ID for the scanner element
      const scannerId = "qr-reader"

      // Initialize the scanner
      scanner = new Html5QrcodeScanner(
        scannerId,
        {
          fps: 10,
          qrbox: 250,
          disableFlip: false,
          showTorchButtonIfSupported: true,
        },
        false, // Don't start scanning automatically
      )

      // Start scanning
      scanner.render(
        (decodedText) => {
          // On successful scan
          handleScanResult(decodedText)
          scanner.clear() // Stop scanning
        },
        (errorMessage) => {
          // Ignore errors during scanning as they're usually just frames without QR codes
          if (errorMessage.includes("Unable to start scanning")) {
            setError("Camera access denied or not available")
          }
        },
      )
    }

    // Cleanup function
    return () => {
      if (scanner) {
        scanner.clear().catch((error) => console.error("Error clearing scanner:", error))
      }
    }
  }, [scanning])

  const startScanning = () => {
    setScanning(true)
    setError(null)
  }

  const handleScanResult = (result) => {
    try {
      // Check if the result is a URL
      let url
      try {
        url = new URL(result)
      } catch (e) {
        // If it's not a URL, assume it's just a QR code
        navigate(`/attendance/${result}`)
        return
      }

      // Extract the QR code from the URL
      // Expected format: /attendance/[qrCode]
      const pathParts = url.pathname.split("/")
      if (pathParts.length >= 3 && pathParts[1] === "attendance") {
        const qrCode = pathParts[2]
        navigate(`/attendance/${qrCode}`)
      } else {
        // If it's not a URL in the expected format, just use the scanned text as the QR code
        navigate(`/attendance/${result}`)
      }
    } catch (error) {
      console.error("Error processing scan result:", error)
      setError("Invalid QR code format")
    }
  }

  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (!manualCode.trim()) {
      setError("Please enter a code")
      return
    }
    navigate(`/attendance/${manualCode}`)
  }

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card">
              <div className="card-header bg-primary text-white">
                <h4 className="mb-0">Scan QR Code</h4>
              </div>
              <div className="card-body">
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                {!scanning ? (
                  <div className="text-center">
                    <p className="mb-4">Scan the QR code provided by your teacher to mark your attendance</p>
                    <button onClick={startScanning} className="btn btn-primary btn-lg mb-4">
                      Start Scanning
                    </button>

                    <hr />

                    <div className="mt-4">
                      <h5>Or Enter Code Manually</h5>
                      <form onSubmit={handleManualSubmit} className="mt-3">
                        <div className="input-group mb-3">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter QR code"
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                          />
                          <button className="btn btn-primary" type="submit">
                            Submit
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div id="qr-reader" className="mb-3"></div>
                    <p className="text-center text-muted mb-3">Position the QR code in the frame to scan</p>
                    <button onClick={() => setScanning(false)} className="btn btn-outline-secondary w-100">
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              <div className="card-footer text-center">
                <Link to="/student" className="btn btn-link">
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ScanQR
