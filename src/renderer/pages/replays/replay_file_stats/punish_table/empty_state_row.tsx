import { toOrdinal } from "@/lib/utils";

import * as T from "../table_components";

type Props = {
  stockOrdinal: number;
};

export const EmptyStateRow = ({ stockOrdinal }: Props) => (
  <T.TableRow>
    <T.TableCell colSpan={6}>{"No punishes on opponent's " + toOrdinal(stockOrdinal)} stock</T.TableCell>
  </T.TableRow>
);
