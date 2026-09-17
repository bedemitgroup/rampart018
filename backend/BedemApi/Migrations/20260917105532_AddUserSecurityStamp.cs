using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BedemApi.Migrations
{
    /// <inheritdoc />
    public partial class AddUserSecurityStamp : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // gen_random_uuid() is built into Postgres 13+ core, no extension
            // needed. A per-row random default (rather than a shared blank
            // string) so existing accounts do not all start out sharing one
            // stamp value at rest - though it makes no practical difference,
            // since a token issued before this migration has no "sstamp"
            // claim at all and fails validation regardless of what is stored.
            migrationBuilder.AddColumn<string>(
                name: "SecurityStamp",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValueSql: "replace(gen_random_uuid()::text, '-', '')");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "PasswordHash", "SecurityStamp" },
                values: new object[] { "$2a$11$BTbqNCoOAWfp9uJ2.Ln5ce3DnF4HzeW8dSYNfal7uMCBX8jZ2Rwpa", "9785a3de82cb411a96bd6d81708cb9f2" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SecurityStamp",
                table: "Users");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$D1Y6Y2GzZOr433yoH5g.zOF73BDTEWAOOo3WeOOqPIdO0APIWo7dG");
        }
    }
}
