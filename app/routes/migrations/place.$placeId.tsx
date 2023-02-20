import { Form, Link, useCatch, useLoaderData, useParams } from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import invariant from "tiny-invariant";
import RoundedList from "~/components/rounded-list";
import { getPlace } from "~/models/place.server";
import { setUserPlace } from "~/models/user.server";
import { requireUserId } from "~/session.server";
import { formatDate, useUser } from "~/utils";

export async function loader({ request, params }: LoaderArgs) {
  invariant(params.placeId, "placeId not found");
  
  const place = await getPlace(params.placeId);

  if (!place) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({ place });
}

export async function action({ request, params }: ActionArgs) {
  invariant(params.placeId, "placeId not found");
  const userId = await requireUserId(request);

  await setUserPlace(userId, params.placeId);

  return json({ status: 200 });
}

export default function PlacePage() {
  const data = useLoaderData<typeof loader>();
  const user = useUser();
  const params = useParams();

  return (
    <div>
      <h3 className="text-2xl font-bold mb-4">{data.place.title}</h3>
      {user.locationId !== params.placeId ? (
        <Form method="post">
          <button type="submit" className="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400">
            Set as my location
          </button>
        </Form>
      ): (
        <p>✅ My current location</p>
      )}
      <p className="my-4">Migrations that go through here:</p>
      <RoundedList
        entries={data.place.migrationSteps}
        emptyText="No steps yet"
        itemClassName="hover:bg-blue-200 click:bg-blue-500"
        renderEntry={(step) => (<Link to={`/migrations/${step.migration.id}`}>
          {step.migration.species} from {formatDate(step.startDate)} to {formatDate(step.endDate)}
        </Link>)}
        getEntryId={(entry) => entry.id}
      />
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
    return <div>Place not found</div>;
  }

  throw new Error(`Unexpected caught response with status: ${caught.status}`);
}

