"use client";

import { useActionState } from "react";
import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteCar, type CarActionState } from "@/lib/actions/car";

interface DeleteCarButtonProps {
  carId: string;
  displayName: string;
}

const initialState: CarActionState = {};

export function DeleteCarButton({ carId, displayName }: DeleteCarButtonProps) {
  const [, formAction, isDeleting] = useActionState(deleteCar, initialState);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={isDeleting}>
          <Trash2Icon className="size-4" />
          {isDeleting ? "Deleting..." : "Delete Car"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {displayName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this car and all associated records.
            This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <form action={formAction}>
            <input type="hidden" name="carId" value={carId} />
            <AlertDialogAction
              type="submit"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
