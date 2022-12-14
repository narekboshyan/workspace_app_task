import { Button, Grid, makeStyles } from "@material-ui/core";
import TextField from "components/shared/Fields/TextField";
import { FETCH_LOADING_TEXT } from "constants";
import { SNACKBAR_TYPE } from "constants";
import { WORKSPACES_ROUTE } from "constants";
import { CREATE_WORKSPACES } from "graphql/mutations";
import { GET_WORKSPACES } from "graphql/queries";
import { useMutationWithOnError, useQueryWithOnError } from "hooks/apollo";
import React, { useMemo, useState } from "react";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { addLoadingData, addSnackbar, removeLoadingData } from "redux/slices/shared";

const useStyles = makeStyles({
  formControl: { width: "40%", margin: "50px auto" },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  formGroup: {},
  formButton: {},
  createEditWorkspaceContainer: {
    padding: 5,
  },
});

const CreateEditWorkSpace = () => {
  const [workSpaceData, setWorkSpaceData] = useState({
    name: "",
    subDomain: "",
    id: null,
  });
  const classes = useStyles();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { name, subDomain } = workSpaceData;
  const { id } = useParams();

  const { data: workSpaceQueryData, loading: workSpaceIsLoading } = useQueryWithOnError(
    GET_WORKSPACES,
    {
      fetchPolicy: "no-cache",
      variables: {
        id: +id,
      },
      skip: !id,
    }
  );

  const workSpaceFetchedData = useMemo(
    () => workSpaceQueryData?.getWorkSpaces[0] || {},
    [workSpaceQueryData]
  );

  useEffect(() => {
    if (workSpaceQueryData?.getWorkSpaces) {
      const { name, subDomain, id } = workSpaceFetchedData;
      setWorkSpaceData({ name, subDomain, id });
    }
  }, [workSpaceFetchedData, workSpaceQueryData]);

  const [createEditWorkspace, { data: signInQueryData, loading: signInIsLoading }] =
    useMutationWithOnError(CREATE_WORKSPACES);

  useEffect(() => {
    if (signInQueryData) {
      navigate(WORKSPACES_ROUTE);
    }
  }, [signInQueryData, navigate]);

  const inputChangeHandler = (e) => {
    setWorkSpaceData((prevState) => ({
      ...prevState,
      [e.target.id]: e.target.value,
    }));
  };

  const workSpaceSubmitHandler = async (e) => {
    e.preventDefault();

    if (!name || !subDomain) {
      dispatch(
        addSnackbar({
          type: SNACKBAR_TYPE.error,
          message: "Name and SubDomain data should not be empty",
        })
      );
      return;
    }

    if (name === workSpaceFetchedData.name && subDomain === workSpaceFetchedData.subDomain) {
      console.log("SHOULD TRIGGER THIS EVENT");
      dispatch(
        addSnackbar({
          type: SNACKBAR_TYPE.error,
          message: "You did not make any changes",
        })
      );
      return;
    }

    await createEditWorkspace({
      variables: {
        data: workSpaceData,
      },
    });
  };

  useEffect(() => {
    if (signInIsLoading || workSpaceIsLoading) {
      dispatch(
        addLoadingData({
          key: "deleteWorkSpaceIsLoading",
          text: FETCH_LOADING_TEXT,
          open: true,
        })
      );
    } else {
      dispatch(removeLoadingData("deleteWorkSpaceIsLoading"));
    }
  }, [dispatch, signInIsLoading, workSpaceIsLoading]);

  return (
    <Grid className={classes.createEditWorkspaceContainer}>
      <div className={classes.formControl}>
        <form onSubmit={workSpaceSubmitHandler} className={classes.form}>
          <div className={classes.formGroup}>
            <TextField
              required
              placeholder="Name"
              value={name}
              onChange={inputChangeHandler}
              fullWidth
              label="Name"
              id="name"
              autoComplete="name"
              autoFocus
            />
          </div>
          <div className={classes.formGroup}>
            <TextField
              required
              placeholder="SubDomain"
              value={subDomain}
              onChange={inputChangeHandler}
              fullWidth
              label="SubDomain"
              id="subDomain"
              autoComplete="SubDomain"
            />
          </div>
          <div className={classes.formButton}>
            <Button type="submit" color="primary" variant="contained">
              Submit
            </Button>
          </div>
        </form>
      </div>
    </Grid>
  );
};

export default CreateEditWorkSpace;
