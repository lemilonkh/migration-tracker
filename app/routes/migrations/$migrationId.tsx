import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useCatch, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";

import { deleteMigration, getMigration } from "~/models/migration.server";
import { requireUserId } from "~/session.server";
import { formatDate, useUser } from "~/utils";

export async function loader({ request, params }: LoaderArgs) {
  const userId = await requireUserId(request);
  invariant(params.migrationId, "migrationId not found");

  const migration = await getMigration({ userId, id: params.migrationId });
  if (!migration) {
    throw new Response("Not Found", { status: 404 });
  }
  return json({ migration });
}

export async function action({ request, params }: ActionArgs) {
  const userId = await requireUserId(request);
  invariant(params.migrationId, "migrationId not found");

  await deleteMigration({ userId, id: params.migrationId });

  return redirect("/migrations");
}

export default function MigrationDetailsPage() {
  const data = useLoaderData<typeof loader>();
  const user = useUser();

  return (
    <div>
      <h3 className="text-2xl font-bold">{data.migration.title}</h3>
      <p className="py-6">{data.migration.description}</p>
      {data.migration.imageUrl ?
        <img
          src={data.migration.imageUrl}
          alt={data.migration.title}
          className="rounded-lg w-full md:max-w-md" />
        : ""
      }
      <h4 className="text-xl font-bold my-3">Migration steps</h4>
      {data.migration.steps.length === 0 ? <p>No steps yet</p> : (
        <ul className="bg-white rounded-lg border border-gray-200 w-96 text-gray-900">
          {data.migration.steps.map((step, i) => (
            <li key={step.id} className={`px-6 py-2 border-b border-gray-200 w-full ${i === 0 ? 'rounded-t-lg' : ''} ${i === data.migration.steps.length - 1 ? 'rounded-b-lg' : ''}`}>
              At {step.place.title} from {formatDate(step.startDate)} until {formatDate(step.endDate)}
            </li>
          ))}
        </ul>
      )}
      {user.role === 'BIOLOGIST' ? (
        <div className="my-6">
          <Link to='./edit' className="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400">
            Add new steps
          </Link>
        </div>
      ): ''}
      <hr className="my-4" />
      <Form method="post">
        <button
          type="submit"
          className="rounded bg-red-500 py-2 px-4 text-white hover:bg-red-600 focus:bg-red-400"
        >
          Delete
        </button>
      </Form>
    </div>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  return <div>An unexpected error occurred: {error.message}</div>;
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 404) {
    return <div>Migration not found</div>;
  }

  throw new Error(`Unexpected caught response with status: ${caught.status}`);
}
