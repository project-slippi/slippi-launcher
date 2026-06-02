import { toOrdinal } from "@/lib/utils";

import * as T from "../table_components";

type Props = {
  stockCount: number;
};

export const EmptyStateRow = ({ stockCount }: Props) => (
  <T.TableRow>
    <T.TableCell colSpan={6}>{"No punishes on opponent's " + toOrdinal(stockCount)} stock</T.TableCell>
  </T.TableRow>
);
