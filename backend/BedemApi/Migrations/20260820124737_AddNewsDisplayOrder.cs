using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BedemApi.Migrations
{
    /// <inheritdoc />
    public partial class AddNewsDisplayOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DisplayOrder",
                table: "News",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$k0FtUCwJw6/VllTV4Ac3puziRxXB80fOl3NawraNQc.z2xzOspXbC");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DisplayOrder",
                table: "News");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$t5Yhp2PS8EDHZbYABqPgGe5./FzsOrSbGACPREgh67uFU6/m3jej.");
        }
    }
}
