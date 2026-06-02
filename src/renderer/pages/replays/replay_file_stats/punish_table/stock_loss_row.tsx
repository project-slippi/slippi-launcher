import * as T from "../table_components";
import type { StockLossEvent } from "../types";

type Props = {
  loss: StockLossEvent;
};

export const StockLossRow = ({ loss }: Props) => {
  const stockIcons = Array.from({ length: loss.totalStocks }, (_, i) => i + 1).map((stockNum) => (
    <img
      key={stockNum}
      src={loss.characterIconUrl}
      height={20}
      width={20}
      style={{ opacity: stockNum > loss.stockCount ? 0.4 : 1 }}
    />
  ));

  return (
    <T.TableRow>
      <T.TableCell colSpan={6}>
        <div>{stockIcons}</div>
      </T.TableCell>
    </T.TableRow>
  );
};
