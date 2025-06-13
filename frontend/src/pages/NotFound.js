import { Link } from "react-router-dom"
import Navbar from "../components/layout/Navbar"

const NotFound = () => {
  return (
    <>
      <Navbar />
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <h1 className="display-1">404</h1>
            <h2 className="mb-4">Page Not Found</h2>
            <p className="lead mb-4">The page you are looking for does not exist or has been moved.</p>
            <Link to="/" className="btn btn-primary">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default NotFound
