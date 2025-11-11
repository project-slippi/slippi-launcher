import { css } from "@emotion/react";
import styled from "@emotion/styled";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { Controller, useForm } from "react-hook-form";

import { AddCodesMessages as Messages } from "./add_codes.messages";

export const AddCodes = ({
  validateCodeInput,
  onSubmit,
}: {
  validateCodeInput: (codeInput: string) => string | true;
  onSubmit: (codeInput: string) => void;
}) => {
  const { handleSubmit, control } = useForm<{ geckoCodeInput: string }>();
  const onFormSubmit = handleSubmit(({ geckoCodeInput }) => onSubmit(geckoCodeInput));

  return (
    <form
      onSubmit={onFormSubmit}
      css={css`
        height: 100%;
      `}
    >
      <div
        css={css`
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100%;
        `}
      >
        <div
          css={css`
            flex: 1;
          `}
        >
          <Controller
            name="geckoCodeInput"
            control={control}
            defaultValue=""
            render={({ field, fieldState: { error } }) => {
              return (
                <div
                  css={css`
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    height: 100%;
                  `}
                >
                  <div
                    css={css`
                      flex: 1;
                    `}
                  >
                    <TextField
                      {...field}
                      type="textarea"
                      label={Messages.pasteGeckoCodes()}
                      variant="filled"
                      margin="normal"
                      rows="20"
                      sx={{ height: "100%" }}
                      InputProps={{ style: { fontFamily: '"Space Mono", monospace', fontSize: "12px" } }}
                      required={true}
                      autoFocus={true}
                      multiline={true}
                      fullWidth={true}
                      error={Boolean(error)}
                    />
                  </div>
                  {error && <ErrorContainer>{error.message}</ErrorContainer>}
                </div>
              );
            }}
            rules={{
              validate: validateCodeInput,
            }}
          />
        </div>
        <Button type="submit" fullWidth={true} variant="contained" color="secondary">
          {Messages.add()}
        </Button>
      </div>
    </form>
  );
};

const ErrorContainer = styled.div`
  margin: 5px 0;
  font-size: 13px;
  color: ${({ theme }) => theme.palette.error.main};
`;
