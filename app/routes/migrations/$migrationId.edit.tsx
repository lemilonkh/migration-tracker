import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useCatch, useLoaderData } from "@remix-run/react";
import * as React from "react";
import invariant from "tiny-invariant";

import { createMigration, getMigration } from "~/models/migration.server";
import { UserRole } from "~/models/user.server";
import { requireUser } from "~/session.server";

export async function loader({ request, params }: LoaderArgs) {
  invariant(params.migrationId, "migrationId not found");

  const migration = await getMigration({ id: params.migrationId });
  if (!migration) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({ migration });
}

export async function action({ request, params }: ActionArgs) {
  const user = await requireUser(request);

  if (user.role !== UserRole.Biologist) {
    throw new Response("Access denied", { status: 401 });
  }

  invariant(params.migrationId, "migrationId not found");
  const existingMigration = await getMigration({ id: params.migrationId });
  if (!existingMigration) {
    throw new Response("Not Found", { status: 404 });
  }
  if (existingMigration.userId !== user.id) {
    throw new Response("Access denied", { status: 401 });
  }

  const formData = await request.formData();
  const title = formData.get("title");
  const description = formData.get("description");
  const species = formData.get("species");

  if (typeof title !== "string" || title.length === 0) {
    return json(
      { errors: { title: "Title is required", description: null, species: null } },
      { status: 400 }
    );
  }

  if (typeof description !== "string" || description.length === 0) {
    return json(
      { errors: { title: null, description: "Description is required", species: null } },
      { status: 400 }
    );
  }

  if (typeof species !== "string" || species.length === 0) {
    return json(
      { errors: { title: null, description: null, species: "Species is required" } },
      { status: 400 }
    );
  }

  const migration = await createMigration({
    title,
    description,
    userId: user.id,
    species,
    imageUrl: '/img/perched_kingfisher.jpg', // TODO implement image upload
  });

  return redirect(`/migrations/${migration.id}`);
}

export default function EditMigrationPage() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const titleRef = React.useRef<HTMLInputElement>(null);
  const speciesRef = React.useRef<HTMLInputElement>(null);
  const descriptionRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (actionData?.errors?.title) {
      titleRef.current?.focus();
    } else if (actionData?.errors?.description) {
      descriptionRef.current?.focus();
    } else if (actionData?.errors?.species) {
      speciesRef.current?.focus();
    }
  }, [actionData]);

  return (
    <Form
      method="post"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: "100%",
      }}
    >
      <h2 className="text-2xl font-bold leading-4 mb-4">Edit migration</h2>
      <div>
        <label className="flex w-full flex-col gap-1">
          <span>Title: </span>
          <input
            ref={titleRef}
            name="title"
            defaultValue={loaderData.migration.title}
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
          <span>Species: </span>
          <input
            ref={speciesRef}
            name="species"
            defaultValue={loaderData.migration.species}
            className="flex-1 rounded-md border-2 border-blue-500 px-3 text-lg leading-loose"
            aria-invalid={actionData?.errors?.species ? true : undefined}
            aria-errormessage={
              actionData?.errors?.species ? "species-error" : undefined
            }
          />
        </label>
        {actionData?.errors?.species && (
          <div className="pt-1 text-red-700" id="species-error">
            {actionData.errors.species}
          </div>
        )}
      </div>

      <div>
        <label className="flex w-full flex-col gap-1">
          <span>Description: </span>
          <textarea
            ref={descriptionRef}
            name="description"
            defaultValue={loaderData.migration.description}
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

      <div className="text-right">
        <button
          type="submit"
          className="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
        >
          Save
        </button>
      </div>
    </Form>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  return <div>An unexpected error occurred: {error.message}</div>;
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 401) {
    return <div>Access denied - you need the Biologist role to create new migrations</div>;
  }

  throw new Error(`Unexpected caught response with status: ${caught.status}`);
}
