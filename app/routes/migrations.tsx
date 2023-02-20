import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, NavLink, Outlet, useLoaderData } from "@remix-run/react";

import { getUser } from "~/session.server";
import { useOptionalUser } from "~/utils";
import { getMigrationListItems } from "~/models/migration.server";
import { getPlace, getPlaces } from "~/models/place.server";
import Autocomplete from "~/components/autocomplete";

export async function loader({ request }: LoaderArgs) {
  const user = await getUser(request);
  const migrationListItems = await getMigrationListItems();
  const places = await getPlaces();

  const userLocation = user?.locationId ? await getPlace(user.locationId) : null;
  return json({ migrationListItems, places, userLocation });
}

export default function MigrationsPage() {
  const data = useLoaderData<typeof loader>();
  const user = useOptionalUser();

  return (
    <div className="flex h-full min-h-screen flex-col">
      <header className="flex items-center justify-between bg-slate-800 p-4 text-white">
        <h1 className="text-3xl font-bold">
          <Link to=".">🐦 Migration Tracker</Link>
        </h1>
        {user && (<>
          <p>{user.email}</p>
          <Form action="/logout" method="post">
            <button
              type="submit"
              className="rounded bg-slate-600 py-2 px-4 text-blue-100 hover:bg-blue-500 active:bg-blue-600"
            >
              Logout
            </button>
          </Form>
        </>)}
        {!user && (
          <Link to="/login" className="rounded bg-slate-600 py-2 px-4 text-blue-100 hover:bg-blue-500 active:bg-blue-600">
            Login
          </Link>
        )}
      </header>

      <main className="flex h-full bg-white">
        <div className="h-full w-80 border-r bg-gray-50">
          <Autocomplete items={data.places} placeholder="Search places..." />

          <hr />

          {user?.role === "BIOLOGIST" && (
            <>
              <Link to="new" className="block p-4 text-xl text-blue-500">
                ➕ New Migration
              </Link>
              <hr />
            </>
          )}

          {data.userLocation && (
            <>
              <Link to={`place/${data.userLocation.id}`} className="block p-4 text-xl">
                🏠 Migrations in {data.userLocation.title}
              </Link>
              <hr />
            </>
          )}

          {data.migrationListItems.length === 0 ? (
            <p className="p-4">No migrations yet</p>
          ) : (
            <ol>
              {data.migrationListItems.map((migration) => (
                <li key={migration.id}>
                  <NavLink
                    className={({ isActive }) =>
                      `block border-b p-4 text-xl ${isActive ? "bg-white" : ""}`
                    }
                    to={migration.id}
                  >
                    🗺 {migration.title}
                  </NavLink>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="flex-1 p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
