import bcrypt from "bcryptjs";
import { sendEmail } from "../../services/Email.js";
import { InvalidDataError } from "../../errors/InvalidDataError.js";

export const inviteUser = async (_parent, { invitedUserEmail, workspaceId }, context) => {
  try {
    const { prisma, user } = context;

    const invitedUser = await prisma.user.findUnique({
      where: {
        email: invitedUserEmail,
      },
    });

    if (!invitedUser) {
      throw new InvalidDataError("User with this email does not exist");
    }

    await prisma.userOnWorkSpace.create({
      data: {
        userId: invitedUser.id,
        workspaceId,
      },
    });

    const workspace = await prisma.workspace.findUnique({
      where: {
        id: workspaceId,
      },
    });

    sendEmail(`${user.firstName} ${user.lastName}`, invitedUserEmail, workspace.name);

    return true;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const updateProfileData = async (
  _parent,
  { data: { email, password, firstName, lastName } },
  context
) => {
  const { prisma, user } = context;
  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    if (email !== user.email) {
      const emailAlreadyExists = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (emailAlreadyExists) {
        throw new Error("Email already exists");
      }
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        email,
        firstName,
        lastName,
        password: hashedPassword,
      },
    });

    return true;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const getProfileData = async (_parent, args, context) => {
  const { user, prisma } = context;

  const userData = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
    include: {
      profilePicture: {
        select: {
          name: true,
        },
      },
    },
  });

  return userData;
};

export const deleteAccount = async (_parent, args, context) => {
  const { user, prisma } = context;

  const deletedUser = await prisma.user.delete({
    where: {
      id: user.id,
    },
    include: {
      workSpaces: {
        select: {
          workspace: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  const workspaceIds = deletedUser.workSpaces?.map(({ workspace }) => workspace.id);

  if (workspaceIds) {
    await prisma.workspace.deleteMany({
      where: {
        id: {
          in: workspaceIds,
        },
      },
    });
  }

  return true;
};
