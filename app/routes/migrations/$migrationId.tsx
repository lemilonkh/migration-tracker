import type { Place } from "@prisma/client";
import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useCatch, useLoaderData } from "@remix-run/react";
import React, { useEffect } from "react";
import { useState } from "react";
import Datepicker from "react-tailwindcss-datepicker";
import type { DateType } from "react-tailwindcss-datepicker/dist/types";
import invariant from "tiny-invariant";
import RoundedList from "~/components/rounded-list";

import { createMigrationStep } from "~/models/migration-step.server";
import { deleteMigration, getMigration } from "~/models/migration.server";
import { createObservation } from "~/models/observation.server";
import { getPlaceByTitle, getPlaces } from "~/models/place.server";
import { UserRole } from "~/models/user.server";
import { getUser, requireUserId } from "~/session.server";
import { formatDate, formatFullDate, isIsoDate, useOptionalUser } from "~/utils";

export async function loader({ request, params }: LoaderArgs) {
  invariant(params.migrationId, "migrationId not found");

  const migration = await getMigration({ id: params.migrationId });
  if (!migration) {
    throw new Response("Not Found", { status: 404 });
  }

  let places: Place[] = [];

  const user = await getUser(request);
  if (user && user.role === UserRole.Biologist) {
    places = await getPlaces();
  }

  return json({ migration, places });
}

export async function action({ request, params }: ActionArgs) {
  const userId = await requireUserId(request);
  invariant(params.migrationId, "migrationId not found");
  const form = await request.formData();
  const method = form.get("method");

  if (method === "delete") {
    await deleteMigration({ userId, id: params.migrationId });
    return redirect("/migrations");
  } else if (method === "post-observation") {
    return saveObservation(params.migrationId, form, userId);
  } else {
    return saveMigrationStep(params.migrationId, form);
  }
}

async function saveMigrationStep(migrationId: string, form: FormData) {
  const errors: Record<string, string | null> = { startDate: null, endDate: null, title: null, latitude: null, longitude: null };
  const startDate = form.get("startDate");
  const endDate = form.get("endDate");
  const title = form.get("title");
  const latitude = parseFloat(form.get("latitude")?.toString() as string);
  const longitude = parseFloat(form.get("longitude")?.toString() as string);

  if (typeof startDate !== "string" || !isIsoDate(startDate)) {
    errors.startDate = 'Invalid start date';
    return json({ errors }, { status: 400 });
  }

  if (typeof endDate !== "string" || !isIsoDate(endDate)) {
    errors.endDate = 'Invalid end date';
    return json({ errors }, { status: 400 });
  }

  if (startDate > endDate) {
    errors.endDate = 'End date must be before start date';
    return json({ errors }, { status: 400 });
  }

  if (typeof title !== "string" || title.length === 0) {
    errors.title = 'Place title is required';
    return json({ errors }, { status: 400 });
  }

  if (latitude && (latitude > 90 || latitude < -90)) {
    errors.latitude = 'Invalid latitude value';
    return json({ errors }, { status: 400 });
  }

  if (longitude && (longitude > 180 || longitude < -180)) {
    errors.longitude = 'Invalid longitude value';
    return json({ errors }, { status: 400 });
  }

  const migrationStep = await createMigrationStep({
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    migrationId,
    title,
    latitude,
    longitude
  });

  return json({ errors, migrationStep }, { status: 200 });
}

async function saveObservation(migrationId: string, form: FormData, userId: string) {
  const errors: Record<string, string | null> = { title: null, description: null, place: null };
  const title = form.get("title");
  const description = form.get("description");
  const placeTitle = form.get("place");

  if (typeof title !== "string" || title.length === 0) {
    errors.title = 'Title is required';
    return json({ errors }, { status: 400 });
  }

  if (typeof description !== "string" || description.length === 0) {
    errors.description = 'Description is required';
    return json({ errors }, { status: 400 });
  }

  if (typeof placeTitle !== "string" || placeTitle.length === 0) {
    errors.place = 'Place is required';
    return json({ errors }, { status: 400 });
  }

  const place = await getPlaceByTitle(placeTitle);
  if (!place) {
    errors.place = 'Place not found';
    return json({ errors }, { status: 404 });
  }

  const migrationStep = await createObservation({
    title,
    description,
    imageUrl: '/img/perched_kingfisher.jpg',
    userId,
    migrationId,
    placeId: place.id,
  });

  return json({ errors, migrationStep }, { status: 200 });
}

function EditSteps() {
  const [showForm, setShowForm] = useState(false);
  const [dateValue, setDateValue] = useState<{startDate: Date | null, endDate: Date | null}>({
    startDate: null,
    endDate: null,
  });

  const handleValueChange = (newValue: any) => {
    console.log("Selected date range:", newValue);
    setDateValue(newValue);
  }

  const formatDate = (date: DateType) => {
    if(date instanceof Date) {
      return date.toISOString();
    } else if(typeof date === "string") {
      return new Date(date).toISOString();
    } else {
      return "";
    }
  }

  const actionData = useActionData<typeof action>();
  const titleRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="pt-4">
      {showForm ? (
        <Form method="post" className="flex flex-col w-full md:max-w-md" onSubmit={() => setShowForm(false)}>
          <input type="hidden" name="startDate" value={formatDate(dateValue.startDate)} />
          <input type="hidden" name="endDate" value={formatDate(dateValue.endDate)} />
          <input type="hidden" name="longitude" value={52.5122057} />
          <input type="hidden" name="latitude" value={13.4161025} />

          <div>
            <label className="flex w-full flex-col gap-1">
              <span className="mb-4">Date range: </span>
              <Datepicker
                value={dateValue}
                onChange={handleValueChange}
                displayFormat="MM-DD"
              />
            </label>
            {actionData?.errors?.startDate && (
              <div className="pt-1 text-red-700" id="start-date-error">
                {actionData.errors.startDate}
              </div>
            )}
            {actionData?.errors?.endDate && (
              <div className="pt-1 text-red-700" id="end-date-error">
                {actionData.errors.endDate}
              </div>
            )}
          </div>
          
          <div className="pb-6 pt-4">
            <label className="flex w-full flex-col gap-1">
              <span>Place name: </span>
              <input
                ref={titleRef}
                name="title"
                className="flex-1 rounded-md border-2 border-blue-500 px-3 text-lg leading-loose"
                aria-invalid={actionData?.errors?.title ? true : undefined}
                aria-errormessage={
                  actionData?.errors?.title ? "title-error" : undefined
                }
              />
            </label>
            {actionData?.errors?.title && (
              <div className="pt-1 text-red-700" id="title-error">
                {actionData.errors.title}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="rounded bg-emerald-500 py-2 px-4 text-white hover:bg-emerald-600 focus:bg-emerald-400"
          >
            Save
          </button>
        </Form>
      ) : (
        <div>
          <button onClick={() => setShowForm(true)} className="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400">
            Add new step
          </button>
        </div>
      )}
    </div>
  );
}

function EditObservation() {
  const [showForm, setShowForm] = useState(false);
  const actionData = useActionData<typeof action>();
  useEffect(() => {
    if (actionData?.errors && Object.values(actionData?.errors).some(error => !!error)) {
      setShowForm(true);
    }
  }, [actionData, setShowForm]);

  return (
    <div className="pt-4">
      {showForm ? (
        <Form method="post" className="flex flex-col w-full md:max-w-md" onSubmit={() => setShowForm(false)}>
          <input type="hidden" name="method" value="post-observation" />
          <div className="pb-6 pt-4">
            <label className="flex w-full flex-col gap-1">
              <span>Title: </span>
              <input
                name="title"
                className="flex-1 rounded-md border-2 border-blue-500 px-3 text-lg leading-loose"
                aria-invalid={actionData?.errors?.title ? true : undefined}
                aria-errormessage={
                  actionData?.errors?.title ? "title-error" : undefined
                }
              />
            </label>
            {actionData?.errors?.title && (
              <div className="pt-1 text-red-700" id="title-error">
                {actionData.errors.title}
              </div>
            )}
          </div>

          <div>
            <label className="flex w-full flex-col gap-1">
              <span>Description: </span>
              <textarea
                name="description"
                rows={8}
                className="w-full flex-1 rounded-md border-2 border-blue-500 py-2 px-3 text-lg leading-6"
                aria-invalid={actionData?.errors?.description ? true : undefined}
                aria-errormessage={
                  actionData?.errors?.description ? "description-error" : undefined
                }
              />
            </label>
            {actionData?.errors?.description && (
              <div className="pt-1 text-red-700" id="description-error">
                {actionData.errors.description}
              </div>
            )}
          </div>

          <div className="pb-6 pt-4">
            <label className="flex w-full flex-col gap-1">
              <span>Place: </span>
              <input
                name="place"
                className="flex-1 rounded-md border-2 border-blue-500 px-3 text-lg leading-loose"
                aria-invalid={actionData?.errors?.place ? true : undefined}
                aria-errormessage={
                  actionData?.errors?.place ? "place-error" : undefined
                }
              />
            </label>
            {actionData?.errors?.place && (
              <div className="pt-1 text-red-700" id="place-error">
                {actionData.errors.place}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="rounded bg-emerald-500 py-2 px-4 text-white hover:bg-emerald-600 focus:bg-emerald-400"
          >
            Save
          </button>
        </Form>
      ) : (
        <div>
          <button onClick={() => setShowForm(true)} className="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400">
            Add new observation
          </button>
        </div>
      )}
    </div>
  );
}

export default function MigrationDetailsPage() {
  const data = useLoaderData<typeof loader>();
  const user = useOptionalUser();

  return (
    <div>
      <h3 className="text-2xl font-bold">
        {data.migration.title}
        {data.migration.userId === user?.id ? (
          <Link to="edit" className="text-gray-300/75 ml-3">
            ?????? Edit
          </Link>
        ) : ""}
      </h3>
      <p className="py-6">{data.migration.description}</p>
      {data.migration.imageUrl &&
        <img
          src={data.migration.imageUrl}
          alt={data.migration.title}
          className="rounded-lg w-full lg:max-w-lg" />
      }
      <h4 className="text-xl font-bold my-3">Migration steps</h4>
      <RoundedList
        entries={data.migration.steps}
        emptyText="No steps yet"
        itemClassName=""
        renderEntry={(entry) => (<>In {entry.place.title} from {formatDate(entry.startDate)} until {formatDate(entry.endDate)}</>)}
        getEntryId={(entry) => entry.id}
      />
      {user?.role === 'BIOLOGIST' ? (
        <EditSteps />
      ): ''}
      <h4 className="text-xl font-bold my-3">Observations</h4>
      <RoundedList
        entries={data.migration.observations}
        emptyText="No observations yet"
        itemClassName=""
        renderEntry={(entry) => (<>
          <b>{entry.title}</b>
          <p>by {entry.user.email} {entry.place && (<>in {entry.place?.title}</>)} at {formatFullDate(entry.createdAt)}</p>
          <hr />
          <div className="flex flex-row mt-4">
            {entry.imageUrl && <img alt={entry.title} src={entry.imageUrl} className="flex-initial rounded-lg w-40 resize mr-4" />}
            <p className="flex-auto">{entry.description}</p>
          </div>
        </>)}
        getEntryId={(entry) => entry.id}
      />
      {user && <EditObservation />}

      {user?.id === data.migration.userId && <>
        <hr className="my-4" />
        <Form method="post" className="mb-4">
          <input type="hidden" name="method" value="delete" />
          <button
            type="submit"
            className="rounded bg-red-500 py-2 px-4 text-white hover:bg-red-600 focus:bg-red-400"
          >
            Delete
          </button>
        </Form>
      </>}
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
