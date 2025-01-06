import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface InitialState {
  dealCoordinatorId: string;
}

const initialState: InitialState = {
  dealCoordinatorId: "",
};

export const dealCoordinatorSlice = createSlice({
  name: "dealCoordinator",
  initialState,
  reducers: {
    setCurrentDealCoord: (state, action: PayloadAction<string>) => {
      state.dealCoordinatorId = action.payload;
    },
  },
});

export const { setCurrentDealCoord } = dealCoordinatorSlice.actions;

export default dealCoordinatorSlice.reducer;
