import { useEffect, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../components/protectedRoute";
import { isJwtExpired } from "../utils/jwt";
import Navbar from "../components/navbar";
import AdminNavbar from "../components/adminNavabar";
import ResourceIcon, {
  ResourceSearch,
  ResourceExternal,
} from "../components/resourceIcon";
import ResourceLibrary from "../components/resourceLibrary";
import resources from "../data/memberResources.json";
import "../css/memberResources.css";

export default function MemberResources() {
  const { token, user } = useAuth();
  const { libraryId } = useParams();
  const [query, setQuery] = useState("");
  const [searchParams] = useSearchParams();
  const library = resources.libraries.find((item) => item.id === libraryId);
  const isAccessible = Boolean(
    token && !isJwtExpired(token) && (!libraryId || library),
  );
  useEffect(() => {
    if (!isAccessible) return;
    // Color the document canvas too, including browser overscroll beyond the page.
    document.documentElement.classList.add("member-resources-page");
    return () =>
      document.documentElement.classList.remove("member-resources-page");
  }, [isAccessible]);
  useEffect(() => {
    const previous = document.title;
    document.title = `${library?.name || "Member Resources"} | Delta Sigma Phi`;
    return () => {
      document.title = previous;
    };
  }, [library]);
  if (!token || isJwtExpired(token)) return <Navigate to="/login" replace />;
  if (libraryId && !library) return <Navigate to="/resources" replace />;
  const matches = (item) =>
    `${item.name} ${item.description}`
      .toLowerCase()
      .includes(query.trim().toLowerCase());
  const portals = resources.portals.filter(matches);
  const libraries = resources.libraries.filter(matches);
  const showReport = matches(resources.report);
  return (
    <div className="mr-shell">
      {user?.position === "admin" ? <AdminNavbar /> : <Navbar />}
      <div className="member-resources">
        <a className="mr-skip" href="#resource-content">
          Skip to resources
        </a>
        <main
          id="resource-content"
          tabIndex={-1}
          className={`mr-main ${library ? "mr-main--library" : ""}`}
        >
          {library ? (
            <ResourceLibrary
              key={`${library.id}:${searchParams.get("folder") || ""}`}
              library={library}
            />
          ) : (
            <>
              <header className="mr-heading">
                <div>
                  <h1>Member Resources</h1>
                  <p>Everything you need as a Delta Sig member.</p>
                </div>
                <ResourceSearch
                  value={query}
                  onChange={setQuery}
                  placeholder="Search resources…"
                />
              </header>
              {portals.length > 0 && (
                <section className="mr-portals" aria-label="Member portals">
                  {portals.map((item) => (
                    <ResourceExternal
                      key={item.id}
                      href={item.url}
                      className="mr-portal"
                      title={item.description}
                    >
                      <span className="mr-portal-icon">
                        <ResourceIcon name={item.icon} size={34} />
                      </span>
                      <span>{item.name}</span>
                      <ResourceIcon name="external" size={22} />
                    </ResourceExternal>
                  ))}
                </section>
              )}
              {libraries.length > 0 && (
                <section
                  className="mr-libraries"
                  aria-labelledby="libraries-heading"
                >
                  <h2 id="libraries-heading">Document Libraries</h2>
                  <div className="mr-library-links">
                    {libraries.map((item) => (
                      <Link
                        key={item.id}
                        to={`/resources/${item.id}`}
                        className="mr-library-link"
                      >
                        <span className="mr-tile">
                          <ResourceIcon name={item.icon} size={36} />
                        </span>
                        <span className="mr-library-copy">
                          <strong>{item.name}</strong>
                          <span>{item.description}</span>
                        </span>
                        <ResourceIcon name="arrow" size={27} />
                      </Link>
                    ))}
                  </div>
                </section>
              )}
              {showReport && (
                <ResourceExternal
                  href={resources.report.url}
                  className="mr-report"
                >
                  <span className="mr-tile">
                    <ResourceIcon name="shield" size={36} />
                  </span>
                  <strong>{resources.report.name}</strong>
                  <ResourceIcon name="external" size={23} />
                </ResourceExternal>
              )}
              {!portals.length && !libraries.length && !showReport && (
                <div className="mr-empty" role="status">
                  <ResourceIcon name="search" size={34} />
                  <h2>No matching resources</h2>
                  <p>Try “academic”, “dues”, or “chapter”.</p>
                  <button className="mr-button" onClick={() => setQuery("")}>
                    Clear search
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
