import { AddShoppingCart } from "@mui/icons-material";
import { Avatar, Button, Card, CardActions, CardContent, Chip, Grid, Stack, Typography } from "@mui/material";

import { tileGradients } from "../theme";
import type { Product } from "../types";

type Props = { products: Product[]; onAdd: (productId: string) => void };

export default function ProductGrid({ products, onAdd }: Props) {
  return (
    <Grid container spacing={2.5}>
      {products.map((p, index) => (
        <Grid item xs={12} sm={6} key={p.id}>
          <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column", borderColor: "divider" }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Avatar
                variant="rounded"
                sx={{ width: 46, height: 46, mb: 1.5, fontWeight: 800, background: tileGradients[index % tileGradients.length] }}
              >
                {p.name[0]}
              </Avatar>
              <Typography variant="subtitle1" fontWeight={700}>{p.name}</Typography>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>
                <Typography variant="h6" color="primary">${p.price}</Typography>
                <Chip
                  size="small"
                  variant={p.stock > 0 ? "outlined" : "filled"}
                  color={p.stock > 0 ? "default" : "error"}
                  label={p.stock > 0 ? `${p.stock} left` : "Sold out"}
                />
              </Stack>
            </CardContent>
            <CardActions sx={{ p: 2, pt: 0 }}>
              <Button
                fullWidth
                variant="contained"
                disableElevation
                startIcon={<AddShoppingCart />}
                disabled={p.stock === 0}
                onClick={() => onAdd(p.id)}
              >
                Add to cart
              </Button>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
