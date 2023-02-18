import { Link } from "@remix-run/react";

export default function MigrationIndexPage() {
  return (
    <p>
      No migration selected. Select a migration on the left, or{" "}
      <Link to="new" className="text-blue-500 underline">
        create a new migration.
      </Link>
    </p>
  );
}
